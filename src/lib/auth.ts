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
  const raw =
    req.headers.get("authorization") ??
    req.headers.get("Authorization") ??
    "";

  const token = raw.replace(/^Bearer\s+/i, "").trim(); // soporta Bearer / bearer + espacios

  if (!token) throw new Error("UNAUTHORIZED");

  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}


export function requireRole(expected: "ADMIN" | "USER", actual: "ADMIN" | "USER") {
  if (expected !== actual) throw new Error("FORBIDDEN");
}
