import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { hashPassword } from "@/src/lib/password";
import { User } from "@/src/models/User";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(req: Request) {
  try {
    const user = requireAuth(req);
    requireRole("ADMIN", user.role);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const classroomId = searchParams.get("classroomId");
    const isActive = searchParams.get("isActive");

    const query: any = { role: "USER" }; // Only fetch Students
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (classroomId) query.classroomId = classroomId;
    if (isActive !== null) query.isActive = isActive === "true";

    const students = await User.find(query)
      .populate("classroomId", "name")
      .select("-passwordHash") // Exclude password
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = requireAuth(req);
    requireRole("ADMIN", adminUser.role);
    await connectDB();

    const { name, email, password, classroomId, isActive } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: "USER",
      classroomId: classroomId || null, // Ensure empty string becomes null or if valid it saves
      isActive: isActive ?? true
    });

    await AuditLog.create({
      action: "CREATE_STUDENT",
      actorId: adminUser.sub,
      targetType: "User",
      targetId: newUser._id,
      meta: { name, email }
    });

    return NextResponse.json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      classroomId: newUser.classroomId,
      isActive: newUser.isActive
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
