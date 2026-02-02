import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Schedule } from "@/src/models/Schedule";
import { AuditLog } from "@/src/models/AuditLog";
import { User } from "@/src/models/User";

export async function GET(req: Request) {
  try {
    const user = requireAuth(req);
    requireRole("ADMIN", user.role);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const isActive = searchParams.get("isActive");

    const query: any = {};
    if (siteId) query.siteId = siteId;
    if (dayOfWeek) query.dayOfWeek = Number(dayOfWeek);
    if (isActive !== null) query.isActive = isActive === "true";

    const schedules = await Schedule.find(query)
      .populate("siteId", "name")
      .populate("userId", "name email")
      .sort({ dayOfWeek: 1, startTime: 1 })
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
    const { userId, siteId, dayOfWeek, startTime, endTime, lateAfterMinutes } = body;

    if (!userId || !siteId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const newSchedule = await Schedule.create({
      userId,
      siteId,
      dayOfWeek,
      startTime,
      endTime,
      lateAfterMinutes: lateAfterMinutes || 10,
      isActive: true
    });

    await AuditLog.create({
      action: "CREATE_SCHEDULE",
      actorId: adminUser.sub,
      targetType: "Schedule",
      targetId: newSchedule._id
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
