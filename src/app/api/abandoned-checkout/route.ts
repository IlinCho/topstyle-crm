import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Upserts a snapshot of an in-progress checkout, keyed by a client-generated
// id that lives in localStorage (see CheckoutForm.tsx). Called debounced
// whenever the customer types their contact info or moves between steps, so
// the admin can see (and follow up on) checkouts that never turn into a real
// order - see /admin/abandoned. Deleted from /api/checkout once the order is
// actually placed with the same key.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientKey = String(body.clientKey || "").trim();
    if (!clientKey) return NextResponse.json({ error: "missing clientKey" }, { status: 400 });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    // Nothing worth recording yet - don't create a row for a checkout page
    // visit where the customer hasn't typed anything identifying.
    if (!name && !email && !phone) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const city = String(body.city || "").trim();
    const step = Math.min(3, Math.max(1, Number(body.step) || 1));
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const totalBgn = lines.reduce(
      (s: number, l: any) => s + (Number(l.qty) || 0) * (Number(l.priceBgn) || 0),
      0
    );

    await db.abandonedCheckout.upsert({
      where: { clientKey },
      update: { name, email, phone, city, step, itemsJson: JSON.stringify(lines), totalBgn },
      create: { clientKey, name, email, phone, city, step, itemsJson: JSON.stringify(lines), totalBgn },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
