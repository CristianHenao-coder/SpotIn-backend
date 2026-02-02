import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Classroom } from "@/src/models/Classroom";
import { AuditLog } from "@/src/models/AuditLog";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const updated = await Classroom.findByIdAndUpdate(id, body, { new: true });

        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "UPDATE_CLASSROOM",
            actorId: user.sub,
            targetType: "Classroom",
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
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);
        await connectDB();
        const { id } = await params;

        // Soft Delete
        const deleted = await Classroom.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "DELETE_CLASSROOM",
            actorId: user.sub,
            targetType: "Classroom",
            targetId: id
        });

        return NextResponse.json({ message: "Classroom disabled" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
