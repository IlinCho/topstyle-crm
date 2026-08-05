import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// "Бърза поръчка" - a one-tap order straight from the product page: just
// name + phone, no address/checkout wizard. The store calls the customer
// back to confirm delivery details. Deliberately its own endpoint (not a
// variant of /api/checkout) because the required-field set is genuinely
// different - full checkout requires city/delivery method, this doesn't.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, name, phone, size, color, qty, priceBgn, priceEur, productName } = body as {
      productId: string;
      name: string;
      phone: string;
      size: string;
      color: string;
      qty: number;
      priceBgn: number;
      priceEur: number;
      productName: string;
    };

    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "").trim();

    if (!productId || !size) {
      return NextResponse.json({ error: "Липсва избран размер." }, { status: 400 });
    }
    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Моля, въведете вашето име." }, { status: 400 });
    }
    if (cleanPhone.replace(/[^0-9+]/g, "").length < 6) {
      return NextResponse.json({ error: "Моля, въведете валиден телефонен номер." }, { status: 400 });
    }

    const safeQty = Math.max(1, Math.min(10, Number(qty) || 1));

    // Never trust stock/price from the client - re-check live, same principle
    // as the rest of the site's Smart Scarcity system.
    const variant = await db.productVariant.findFirst({
      where: { productId, size, ...(color ? { color } : {}) },
    });
    if (!variant || variant.stock <= 0) {
      return NextResponse.json({ error: "Този размер вече е изчерпан." }, { status: 409 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
    }

    const orderNumber = `TQ${Date.now().toString().slice(-8)}`;
    const totalBgn = product.priceBgn * safeQty;
    const totalEur = product.priceEur * safeQty;

    const order = await db.order.create({
      data: {
        orderNumber,
        guestName: cleanName,
        guestPhone: cleanPhone,
        guestEmail: "",
        address: "",
        city: "",
        deliveryMethod: "quick_order",
        status: "pending",
        totalBgn,
        totalEur,
        items: {
          create: [
            {
              productId,
              productName: productName || product.name,
              size,
              color: color || variant.color,
              qty: safeQty,
              priceBgn: product.priceBgn,
              priceEur: product.priceEur,
            },
          ],
        },
      },
    });

    await db.productVariant.update({
      where: { id: variant.id },
      data: { stock: Math.max(0, variant.stock - safeQty) },
    });

    return NextResponse.json({ orderNumber: order.orderNumber });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Възникна грешка. Опитайте отново или ни се обадете." }, { status: 500 });
  }
}
