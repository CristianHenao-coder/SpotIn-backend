import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { QrSession } from "@/src/models/QrSession";
import { Attendance } from "@/src/models/Attendance";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();
        const { id } = await params;

        const session = await QrSession.findById(id).populate("siteId", "name").lean();
        if (!session) return NextResponse.json({ message: "Not found" }, { status: 404 });

        // Count scans
        const totalScans = await Attendance.countDocuments({ qrSessionId: id });
        const confirmedScans = await Attendance.countDocuments({ qrSessionId: id, status: "CONFIRMED" });

        return NextResponse.json({
            ...session,
            totalScans,
            confirmedScans
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();
        const { id } = await params;

        // Expire immediately
        const updated = await QrSession.findByIdAndUpdate(
            id,
            { expiresAt: new Date() },
            { new: true }
        );

        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "EXPIRE_QR_SESSION",
            performedBy: adminUser.sub,
            details: { qrSessionId: id }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
