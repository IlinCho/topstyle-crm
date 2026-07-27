import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, lines, delivery } = body as {
      customer: { name: string; email: string; phone: string; address: string; city: string };
      lines: { productId: string; name: string; size: string; color: string; qty: number; priceBgn: number; priceEur: number }[];
      delivery?: { method: string; officeName?: string };
    };

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: "Количката е празна." }, { status: 400 });
    }
    if (!customer?.name || !customer?.phone || !customer?.city) {
      return NextResponse.json({ error: "Липсват данни за доставка." }, { status: 400 });
    }
    if (!delivery?.method) {
      return NextResponse.json({ error: "Моля изберете начин на доставка." }, { status: 400 });
    }
    if (delivery.method === "speedy_address" && !customer?.address) {
      return NextResponse.json({ error: "Липсва адрес за доставка." }, { status: 400 });
    }
    if (delivery.method === "econt_office" && !delivery.officeName) {
      return NextResponse.json({ error: "Липсва избран офис на Еконт." }, { status: 400 });
    }

    const totalBgn = lines.reduce((s, l) => s + l.qty * l.priceBgn, 0);
    const totalEur = lines.reduce((s, l) => s + l.qty * l.priceEur, 0);
    const orderNumber = `TS${Date.now().toString().slice(-8)}`;

    // Attribute the order to the logged-in account, if any - derived from the
    // server-side session cookie, never trusted from the request body, so a
    // client can't attach an order to someone else's account.
    const session = await getCustomerSession();

    let customerRecord = null;
    if (session) {
      customerRecord = await db.customer.update({
        where: { id: session.sub },
        data: { name: customer.name, phone: customer.phone, address: customer.address, city: customer.city },
      });
    } else if (customer.email) {
      customerRecord = await db.customer.upsert({
        where: { email: customer.email },
        update: { name: customer.name, phone: customer.phone, address: customer.address, city: customer.city },
        create: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
        },
      });
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: customerRecord?.id,
        guestName: customer.name,
        guestEmail: customer.email || "",
        guestPhone: customer.phone,
        address: customer.address,
        city: customer.city,
        deliveryMethod: delivery.method,
        officeName: delivery.officeName || "",
        totalBgn,
        totalEur,
        items: {
          create: lines.map((l) => ({
            productId: l.productId || null,
            productName: l.name,
            size: l.size,
            color: l.color,
            qty: l.qty,
            priceBgn: l.priceBgn,
            priceEur: l.priceEur,
          })),
        },
      },
    });

    // Best-effort stock decrement - ignore mismatches silently (demo-grade).
    for (const l of lines) {
      if (!l.productId) continue;
      const variant = await db.productVariant.findFirst({
        where: { productId: l.productId, size: l.size, color: l.color },
      });
      if (variant && variant.stock > 0) {
        await db.productVariant.update({
          where: { id: variant.id },
          data: { stock: Math.max(0, variant.stock - l.qty) },
        });
      }
    }

    return NextResponse.json({ orderNumber: order.orderNumber });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Възникна грешка. Опитайте отново." }, { status: 500 });
  }
}
