import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Classroom } from "@/src/models/Classroom";
import { User } from "@/src/models/User";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(req: Request) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);
        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const siteId = searchParams.get("siteId");
        const isActive = searchParams.get("isActive");

        const query: any = {};
        if (search) query.name = { $regex: search, $options: "i" };
        if (siteId) query.siteId = siteId;
        if (isActive !== null) query.isActive = isActive === "true";

        const classrooms = await Classroom.find(query)
            .populate("siteId", "name")
            .populate("scheduleIds", "name startTime endTime")
            .lean();

        // Calculate student counts manually (User model has classroomId)
        // Optimization: Group users by classroomId in one Aggregation usually better, 
        // but simplified via separate queries or Promise.all for "strict no arch change" logic if aggregations scary.
        // Let's use Promise.all to attach counts.
        const data = await Promise.all(classrooms.map(async (c: any) => {
            const count = await User.countDocuments({ classroomId: c._id, isActive: true });
            return { ...c, studentsCount: count };
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role); // User payload has 'sub' as ID strings
        await connectDB();

        const { name, siteId, scheduleIds, isActive } = await req.json();

        if (!name || !siteId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const newClassroom = await Classroom.create({
            name,
            siteId,
            scheduleIds: scheduleIds || [],
            isActive: isActive ?? true
        });

        await AuditLog.create({
            action: "CREATE_CLASSROOM",
            actorId: user.sub,
            targetType: "Classroom",
            targetId: newClassroom._id,
            meta: { name, siteId }
        });

        return NextResponse.json(newClassroom, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
