import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { verifyPassword } from "@/src/lib/password";
import { signToken } from "@/src/lib/auth";
import { User } from "@/src/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (!user || !user.isActive) {
      return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
    }

    
    const token = signToken({ sub: String(user._id), role: user.role }, "7d");

    return NextResponse.json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
