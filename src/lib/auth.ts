import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE_NAME = "topstyle_admin_session";
const secretKey = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me");

export async function createSession(adminId: string, email: string) {
  const token = await new SignJWT({ sub: adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ sub: string; email: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// Guard for every admin server action, not just the dashboard pages - a page
// redirect alone doesn't stop someone from invoking a server action directly,
// so every mutating admin action must call this itself too.
export async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Не сте влезли в администраторския панел.");
  }
  return session;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}
