import { db } from "./db";
import { normalizeEmail, normalizePhone } from "./legacy-customers";

export type RepeatIndex = { emailCounts: Map<string, number>; phoneCounts: Map<string, number> };

// Builds a normalized email/phone -> order-count index across ALL orders in
// one query - used to flag "повторен клиент" (repeat customer of the NEW
// site, i.e. 2+ orders here), which is a different signal from the
// PrestaShop-migration "Стар клиент" list in legacy-customers.ts: this one
// is computed live from Order rows, nothing to import, and just means
// "we've seen this email/phone on more than one order in this system".
export async function buildRepeatIndex(): Promise<RepeatIndex> {
  const rows = await db.order.findMany({ select: { guestEmail: true, guestPhone: true } });
  const emailCounts = new Map<string, number>();
  const phoneCounts = new Map<string, number>();
  for (const r of rows) {
    const e = normalizeEmail(r.guestEmail);
    const p = normalizePhone(r.guestPhone);
    if (e) emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
    if (p) phoneCounts.set(p, (phoneCounts.get(p) || 0) + 1);
  }
  return { emailCounts, phoneCounts };
}

export function isRepeatInIndex(index: RepeatIndex, email: string, phone: string): boolean {
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);
  return (!!e && (index.emailCounts.get(e) || 0) > 1) || (!!p && (index.phoneCounts.get(p) || 0) > 1);
}
