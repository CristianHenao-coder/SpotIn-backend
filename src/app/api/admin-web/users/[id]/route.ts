import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { hashPassword } from "@/src/lib/password";
import { User } from "@/src/models/User";
import { AuditLog } from "@/src/models/AuditLog";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        // Handle classroomId: "" -> null to unset it, or keep it if valid
        if (body.classroomId === "") {
            body.classroomId = null;
        }

        // If updating password
        if (body.password) {
            body.passwordHash = await hashPassword(body.password);
            delete body.password;
        }

        const updated = await User.findByIdAndUpdate(id, body, { new: true }).select("-passwordHash");

        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "UPDATE_STUDENT",
            actorId: adminUser.sub,
            targetType: "User",
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

        // Soft Delete
        const deleted = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });

        await AuditLog.create({
            action: "DELETE_STUDENT",
            actorId: adminUser.sub,
            targetType: "User",
            targetId: id
        });

        return NextResponse.json({ message: "Student disabled" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
