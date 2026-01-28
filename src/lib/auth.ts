import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "USER";
};

export function signToken(
  payload: JwtPayload,
  expiresIn: SignOptions["expiresIn"] = "7d"
) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function requireAuth(req: Request): JwtPayload {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function requireRole(expected: "ADMIN" | "USER", actual: "ADMIN" | "USER") {
  if (expected !== actual) throw new Error("FORBIDDEN");
}
