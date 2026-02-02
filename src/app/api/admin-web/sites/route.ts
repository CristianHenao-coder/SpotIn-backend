import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Site } from "@/src/models/Site";

export async function GET(req: Request) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);

        await connectDB();

        const sites = await Site.find({ isActive: true }).select("_id name").lean();

        return NextResponse.json(sites);
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
