import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Schedule } from "@/src/models/Schedule";

const Body = z.object({
  userId: z.string().min(1),
  siteId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // "08:00"
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lateAfterMinutes: z.number().int().min(0).max(180).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("ADMIN", auth.role);

    const body = Body.parse(await req.json());

    await connectDB();

    const schedule = await Schedule.create({
      userId: body.userId,
      siteId: body.siteId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      lateAfterMinutes: body.lateAfterMinutes ?? 10,
      isActive: true,
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ message: "Datos inválidos", issues: e.issues }, { status: 400 });
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
