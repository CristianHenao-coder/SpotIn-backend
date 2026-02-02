import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Schedule } from "@/src/models/Schedule";
import { AuditLog } from "@/src/models/AuditLog";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const updated = await Schedule.findByIdAndUpdate(id, body, { new: true });
        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "UPDATE_SCHEDULE",
            actorId: adminUser.sub,
            targetType: "Schedule",
            targetId: id,
            meta: { updates: body }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();
        const { id } = await params;

        const deleted = await Schedule.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "DELETE_SCHEDULE",
            actorId: adminUser.sub,
            targetType: "Schedule",
            targetId: id
        });

        return NextResponse.json({ message: "Schedule disabled" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
