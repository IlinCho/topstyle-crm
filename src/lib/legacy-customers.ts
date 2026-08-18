import { db } from "./db";

// Normalizes an email for matching against LegacyCustomer rows - just
// lowercase + trim, since that's the only variance real customers produce
// (PrestaShop export and the new checkout form both store emails as typed).
export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

// Normalizes a phone number for matching by keeping only digits and taking
// the last 9 - Bulgarian mobile numbers are 9 digits after the leading
// 0/+359/00359, so "0888123456", "+359888123456" and "00359888123456" all
// collapse to the same "888123456" tail regardless of which prefix style the
// old store or the customer happened to use.
export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.slice(-9);
}

// Checks whether an email/phone pair matches any row imported from the old
// PrestaShop store (Admin -> Стари клиенти). Either field alone is enough to
// match - a customer might have used a different email at checkout but the
// same phone number, or vice versa.
export async function checkIsLegacy(email: string, phone: string): Promise<boolean> {
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePhone(phone);
  if (!normEmail && !normPhone) return false;

  const match = await db.legacyCustomer.findFirst({
    where: {
      OR: [
        ...(normEmail ? [{ email: normEmail }] : []),
        ...(normPhone ? [{ phone: normPhone }] : []),
      ],
    },
    select: { id: true },
  });
  return !!match;
}
