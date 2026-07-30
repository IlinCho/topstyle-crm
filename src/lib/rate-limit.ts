import { headers } from "next/headers";
import { db } from "./db";

// Brute-force protection for login forms (admin + customer). Stored in the
// database rather than in-memory, because serverless functions don't share
// memory between invocations/instances - an in-memory counter would reset
// on every cold start and give no real protection.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function clientIp(): string {
  const h = headers();
  // Vercel sets x-forwarded-for; take the first (original client) address.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export async function isRateLimited(key: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await db.loginAttempt.count({ where: { key, createdAt: { gte: since } } });
  return count >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(key: string): Promise<void> {
  await db.loginAttempt.create({ data: { key } });
  // Best-effort cleanup of this key's old rows so the table doesn't grow
  // unbounded - not critical if it occasionally fails.
  const since = new Date(Date.now() - WINDOW_MS);
  db.loginAttempt.deleteMany({ where: { key, createdAt: { lt: since } } }).catch(() => {});
}

export async function clearAttempts(key: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { key } }).catch(() => {});
}
