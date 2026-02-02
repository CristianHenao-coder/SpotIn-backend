import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Attendance } from "@/src/models/Attendance";
import { User } from "@/src/models/User";

export async function GET(req: Request) {
    try {
        const user = requireAuth(req);
        requireRole("ADMIN", user.role);
        await connectDB();

        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const classroomId = searchParams.get("classroomId");

        const query: any = {};
        if (from || to) {
            query.markedAt = {};
            if (from) query.markedAt.$gte = new Date(from);
            if (to) query.markedAt.$lte = new Date(to + "T23:59:59.999Z");
        }

        if (classroomId) {
            // Find users in classroom
            const users = await User.find({ classroomId }, "_id");
            query.userId = { $in: users.map(u => u._id) };
        }

        const records = await Attendance.find(query).lean();
        const totalRecords = records.length;
        const presentCount = records.filter((r: any) => r.result === "ON_TIME").length;
        const lateCount = records.filter((r: any) => r.result === "LATE").length;
        // Absent count is tricky without knowing expected total. 
        // We can assume absent = Total Students * Days - Present? 
        // For MVP, we'll just track REJECTED or leave absentRate as placeholder or inferred from active students vs present.
        // The prompt asks for absentCount/Rate.
        // Let's rely on Confirmed records.
        const absentCount = 0; // Placeholder as we don't track explicit absences in Attendance model yet (unless they are "REJECTED" or we generate absent records)

        // Calculate simple stats
        const presentRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;
        const lateRate = totalRecords > 0 ? ((lateCount / totalRecords) * 100).toFixed(1) : 0;

        // Top Classrooms with Late Arrivals
        // Group records by userId -> look up user's classroom -> count lates.
        // This is expensive in code. Better to use Aggregation.
        // MVP: Return empty or simulated if too complex without massive aggregation.
        // Let's attempt aggregation.

        const topClassroomsLate = await Attendance.aggregate([
            { $match: { ...query, result: "LATE" } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "classrooms",
                    localField: "user.classroomId",
                    foreignField: "_id",
                    as: "classroom"
                }
            },
            { $unwind: "$classroom" },
            {
                $group: {
                    _id: "$classroom.name",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        return NextResponse.json({
            totalRecords,
            presentCount,
            lateCount,
            absentCount,
            presentRate,
            lateRate,
            absentRate: 0,
            topClassroomsLate
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
