import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Footer "Бюлетин" signup - deliberately minimal (no confirmation
// flow/unsubscribe token yet), just records interest so there's a real list
// to import into a mailing tool later instead of the form being decorative.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const agree = Boolean(body.agree);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Моля въведете валиден имейл." }, { status: 400 });
    }
    if (!agree) {
      return NextResponse.json({ error: "Моля, потвърдете съгласието си с условията." }, { status: 400 });
    }

    // Idempotent - resubscribing with the same email is a no-op, not an error.
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Възникна грешка. Опитайте отново." }, { status: 500 });
  }
}
