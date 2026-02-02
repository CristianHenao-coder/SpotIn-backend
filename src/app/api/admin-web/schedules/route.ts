import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Schedule } from "@/src/models/Schedule";
import { AuditLog } from "@/src/models/AuditLog";
import { Classroom } from "@/src/models/Classroom";

export async function GET(req: Request) {
  try {
    const user = requireAuth(req);
    requireRole("ADMIN", user.role);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const classroomId = searchParams.get("classroomId");
    const isActive = searchParams.get("isActive");

    const query: any = {};
    if (siteId) query.siteId = siteId;
    // Filter if the day is present in the daysOfWeek array
    if (dayOfWeek) query.daysOfWeek = Number(dayOfWeek);
    if (classroomId) query.classroomId = classroomId;
    if (isActive !== null) query.isActive = isActive === "true";

    const schedules = await Schedule.find(query)
      .populate("siteId", "name")
      .populate("classroomId", "name")
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = requireAuth(req);
    requireRole("ADMIN", adminUser.role);
    await connectDB();

    const body = await req.json();
    const { classroomId, siteId, daysOfWeek, startTime, endTime, lateAfterMinutes } = body;

    // Validate Required
    if (!classroomId || !siteId || !startTime || !endTime || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ message: "Missing required fields (classroom, site, days, times)" }, { status: 400 });
    }

    const newSchedule = await Schedule.create({
      classroomId,
      siteId,
      daysOfWeek: daysOfWeek, // Array of numbers
      startTime,
      endTime,
      lateAfterMinutes: lateAfterMinutes || 10,
      isActive: true
    });

    await AuditLog.create({
      action: "CREATE_SCHEDULE",
      actorId: adminUser.sub,
      targetType: "Schedule",
      targetId: newSchedule._id,
      meta: { classroomId, siteId, daysOfWeek }
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
