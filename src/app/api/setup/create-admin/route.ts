import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { hashPassword } from "@/src/lib/password";
import { User } from "@/src/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const setupSecret = req.headers.get("x-setup-secret") || "";
    if (!process.env.SETUP_SECRET || setupSecret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ message: "No permitido" }, { status: 403 });
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    await connectDB();

    const existsAdmin = await User.findOne({ role: "ADMIN" }).lean();
    if (existsAdmin) {
      return NextResponse.json({ message: "Ya existe un ADMIN" }, { status: 409 });
    }

    const passwordHash = await hashPassword(String(password));

    const admin = await User.create({
      name: String(name),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    return NextResponse.json(
      { admin: { id: String(admin._id), email: admin.email, role: admin.role } },
      { status: 201 }
    );
  }  catch (err) {
  console.error("[create-admin] ERROR:", err);
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ message }, { status: 500 });
}

}
