import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Captures a checkout the customer started (typed name/email/phone) but never
// finished - upserted by a client-generated key as CheckoutForm.tsx debounces
// keystrokes in the contact fields (see clientKeyRef there). Nothing is saved
// until at least one piece of identifying info is present, so a customer who
// never types anything never creates a row.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientKey = String(body.clientKey || "").trim();
    if (!clientKey) {
      return NextResponse.json({ error: "missing clientKey" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    if (!name && !email && !phone) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const city = String(body.city || "").trim();
    const step = Math.min(3, Math.max(1, Number(body.step) || 1));
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const totalBgn = lines.reduce((s: number, l: any) => s + (Number(l.qty) || 0) * (Number(l.priceBgn) || 0), 0);

    await db.abandonedCheckout.upsert({
      where: { clientKey },
      update: { name, email, phone, city, step, itemsJson: JSON.stringify(lines), totalBgn },
      create: { clientKey, name, email, phone, city, step, itemsJson: JSON.stringify(lines), totalBgn },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
