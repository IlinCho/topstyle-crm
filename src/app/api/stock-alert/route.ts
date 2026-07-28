import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Captures a "notify me when back in stock" request for a sold-out size/color.
// Read as a real demand signal for restocking - never used to fabricate a
// scarcity claim elsewhere on the site.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId || "");
    const size = String(body.size || "");
    const color = String(body.color || "");
    const email = String(body.email || "").trim();

    if (!productId || !size || !email) {
      return NextResponse.json({ error: "Липсва имейл или размер." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Моля въведете валиден имейл." }, { status: 400 });
    }

    await db.stockAlert.create({ data: { productId, size, color, email } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Възникна грешка. Опитайте отново." }, { status: 500 });
  }
}
