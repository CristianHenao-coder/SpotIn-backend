import { NextResponse } from "next/server";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Schedule } from "@/src/models/Schedule";

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("USER", auth.role);

    await connectDB();

    const schedules = await Schedule.find({ userId: auth.sub, isActive: true })
      .populate("siteId", "name")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ schedules });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
