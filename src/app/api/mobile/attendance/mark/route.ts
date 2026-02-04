import { NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { Site } from "@/src/models/Site";
import { Schedule } from "@/src/models/Schedule";
import { Attendance } from "@/src/models/Attendance";

const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET!;
const TZ = "America/Bogota";

const Body = z.object({
  qrToken: z.string().min(10),
  lat: z.number(),
  lng: z.number(),
});

function timeNowHHmm() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date()); // "08:05"
}
function dayNow() {
  // 0..6
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("USER", auth.role);

    const body = Body.parse(await req.json());

    // 1) validar QR token
    const payload = jwt.verify(body.qrToken, QR_SECRET) as any;
    const { siteId, dateKey, qsid } = payload;

    await connectDB();

    // 2) traer site (radio + coords)
    const site = await Site.findById(siteId).lean() as any;
    if (!site || !site.isActive) return NextResponse.json({ message: "Site inválido" }, { status: 400 });

    const [siteLng, siteLat] = site.location.coordinates;

    // 3) validar distancia
    const dist = haversineMeters(body.lat, body.lng, siteLat, siteLng);
    if (dist > (site.allowedRadiusMeters ?? 50)) {
      return NextResponse.json({ message: "Fuera de rango", distanceMeters: Math.round(dist) }, { status: 403 });
    }

    // 4) validar horario del usuario (día + site)
    const dow = dayNow();
    const schedule = await Schedule.findOne({ userId: auth.sub, siteId, daysOfWeek: dow, isActive: true }).lean() as any;
    if (!schedule) return NextResponse.json({ message: "No tienes horario para hoy" }, { status: 403 });

    const nowHHmm = timeNowHHmm();
    const nowMin = toMinutes(nowHHmm);
    const startMin = toMinutes(schedule.startTime);
    const endMin = toMinutes(schedule.endTime);

    if (nowMin < startMin || nowMin > endMin) {
      return NextResponse.json({ message: "Fuera de horario", now: nowHHmm }, { status: 403 });
    }

    // 5) ON_TIME vs LATE
    const lateCut = startMin + (schedule.lateAfterMinutes ?? 10);
    const result = nowMin <= lateCut ? "ON_TIME" : "LATE";

    // 6) crear asistencia (anti duplicado por {userId, dateKey} unique)
    const attendance = await Attendance.create({
      userId: auth.sub,
      siteId,
      scheduleId: schedule._id,
      qrSessionId: qsid,
      dateKey,
      markedAt: new Date(),
      location: { type: "Point", coordinates: [body.lng, body.lat] },
      distanceMeters: Math.round(dist),
      result,
      status: "PENDING",
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ message: "Datos inválidos", issues: e.issues }, { status: 400 });
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });

    // duplicado: ya marcó hoy
    if (String(e?.code) === "11000") return NextResponse.json({ message: "Ya marcaste hoy" }, { status: 409 });

    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
