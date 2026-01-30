import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { hashPassword } from "@/src/lib/password";
import { User } from "@/src/models/User";


export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    requireRole("ADMIN", auth.role);

    const body = Body.parse(await req.json());

    await connectDB();

    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) return NextResponse.json({ message: "Email ya existe" }, { status: 409 });

    const passwordHash = await hashPassword(body.password);

    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role ?? "USER",
      isActive: true,
    });

    console.log("AUTH HEADER:", req.headers.get("authorization"));
console.log("AUTH HEADER 2:", req.headers.get("Authorization"));

    return NextResponse.json(
      { user: { id: String(user._id), name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ message: "Datos inválidos", issues: e.issues }, { status: 400 });
    }
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ message: "No auth" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ message: "No permitido" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });


    
  }
}
