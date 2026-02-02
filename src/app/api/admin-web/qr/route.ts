import { NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { QrSession } from "@/src/models/QrSession";

const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET!;
const TZ = "America/Bogota";

const Body = z.object({
  siteId: z.string().min(1),
});

function dateKeyNow() {
  // YYYY-MM-DD en TZ sin librerías
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date());
  const y = p.find(x => x.type === "year")!.value;
  const m = p.find(x => x.type === "month")!.value;
  const d = p.find(x => x.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("ADMIN", auth.role);

    const body = Body.parse(await req.json());
    await connectDB();

    const dateKey = dateKeyNow();

    const session = await QrSession.findOneAndUpdate(
      { siteId: body.siteId, dateKey },
      { $setOnInsert: { createdByAdminId: auth.sub } },
      { upsert: true, new: true }
    );

    // Token corto (15 min)
    const qrToken = jwt.sign(
      { qsid: String(session._id), siteId: body.siteId, dateKey },
      QR_SECRET,
      { expiresIn: "15m" }
    );

    return NextResponse.json({ dateKey, siteId: body.siteId, qrToken });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ message: "Datos inválidos", issues: e.issues }, { status: 400 });
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
