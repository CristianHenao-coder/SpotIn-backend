import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { verifyPassword } from "@/src/lib/password";
import { signToken } from "@/src/lib/auth";
import { User } from "@/src/models/User";
import { cookies } from "next/headers";

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

        // Enforce ADMIN role
        if (user.role !== "ADMIN") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const ok = await verifyPassword(String(password), user.passwordHash);
        if (!ok) {
            return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
        }

        // Role is part of the token payload
        const token = signToken({ sub: String(user._id), role: user.role }, "1d");

        // Set HttpOnly Cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
            sameSite: "strict",
        });

        return NextResponse.json({
            message: "Login exitoso",
            user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
