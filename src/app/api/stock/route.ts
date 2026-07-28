import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Live stock lookup for the cart/checkout pages, which only hold cart lines
// in localStorage (no live stock data of their own). Given a list of
// product ids, returns every variant's current real stock so the client can
// match it against each cart line by size/color.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productIds = Array.isArray(body.productIds)
      ? (body.productIds.filter((id: unknown) => typeof id === "string") as string[])
      : [];

    if (productIds.length === 0) {
      return NextResponse.json({ variants: [] });
    }

    const variants = await db.productVariant.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, size: true, color: true, stock: true },
    });

    return NextResponse.json({ variants });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ variants: [] }, { status: 500 });
  }
}
