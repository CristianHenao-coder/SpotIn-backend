import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { AppSetting } from "@/src/models/AppSetting";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(req: Request) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);
        await connectDB();

        let settings = await AppSetting.findOne();
        if (!settings) {
            settings = await AppSetting.create({});
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();

        const body = await req.json();

        // Upsert equivalent
        let settings = await AppSetting.findOne();
        if (settings) {
            Object.assign(settings, body);
            await settings.save();
        } else {
            settings = await AppSetting.create(body);
        }

        await AuditLog.create({
            action: "UPDATE_SETTINGS",
            actorId: adminUser.sub,
            targetType: "AppSetting",
            meta: { updates: body }
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
