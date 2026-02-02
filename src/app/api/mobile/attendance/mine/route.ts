import { NextResponse } from "next/server";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Attendance } from "@/src/models/Attendance";

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("USER", auth.role);

    await connectDB();

    const items = await Attendance.find({ userId: auth.sub })
      .sort({ markedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
