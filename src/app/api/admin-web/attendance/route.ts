import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Attendance } from "@/src/models/Attendance";
import { User } from "@/src/models/User";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(req: Request) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const classroomId = searchParams.get("classroomId");
        const userId = searchParams.get("userId");
        const status = searchParams.get("status");

        const query: any = {};

        if (date) query.dateKey = date;
        if (status) query.status = status;
        if (userId) query.userId = userId;

        // Filter by Classroom: Find users in classroom first
        if (classroomId) {
            const usersInClass = await User.find({ classroomId }).select("_id");
            const ids = usersInClass.map((u: any) => u._id);

            // If query.userId already exists, intersect? user request implies filtering.
            // If specific user filtered AND classroom, we assume user matches. 
            // If only classroom, use the list.
            if (userId) {
                // If the filtered user is not in the classroom, return empty
                if (!ids.some((id: any) => String(id) === String(userId))) {
                    return NextResponse.json([]);
                }
            } else {
                query.userId = { $in: ids };
            }
        }

        const attendance = await Attendance.find(query)
            .populate("userId", "name email")
            .populate("siteId", "name")
            .populate("scheduleId", "startTime endTime")
            .sort({ markedAt: -1 })
            .limit(100) // Limit for performance
            .lean();

        return NextResponse.json(attendance);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
