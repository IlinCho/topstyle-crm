import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

// Separate cookie from the admin session so the two never collide.
const COOKIE_NAME = "topstyle_customer_session";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 90; // 90 days - "remember me" / auto login on return

const secretKey = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me");

export async function createCustomerSession(customerId: string, email: string, remember: boolean = true) {
  const token = await new SignJWT({ sub: customerId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "90d" : "1d")
    .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });
}

export function clearCustomerSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getCustomerSession(): Promise<{ sub: string; email: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  return db.customer.findUnique({ where: { id: session.sub } });
}

export async function verifyCustomerCredentials(email: string, password: string) {
  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer || !customer.passwordHash) return null; // no account (guest-only or unknown email)
  const ok = await bcrypt.compare(password, customer.passwordHash);
  return ok ? customer : null;
}

/**
 * Creates a new login-capable account, or "claims" an existing guest customer
 * record (one that was created from a past guest order, so has no password
 * yet) by attaching a password to it. Returns null if the email already
 * belongs to a registered account (caller should show "already registered").
 */
export async function registerCustomer(opts: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  const existing = await db.customer.findUnique({ where: { email: opts.email } });

  if (existing) {
    if (existing.passwordHash) return null; // already registered
    return db.customer.update({
      where: { id: existing.id },
      data: { passwordHash, name: opts.name || existing.name, phone: opts.phone || existing.phone },
    });
  }

  return db.customer.create({
    data: { email: opts.email, name: opts.name, phone: opts.phone || "", passwordHash },
  });
}
