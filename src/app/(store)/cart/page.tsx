"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatBgn, formatEur } from "@/lib/format";
import TrustStrip from "@/components/TrustStrip";

export default function CartPage() {
  const { lines, remove, setQty, totalBgn, totalEur } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container" style={{ padding: "60px 0" }}>
        <h1>Количката е празна</h1>
        <Link href="/" className="btn" style={{ marginTop: 20, display: "inline-block" }}>Разгледай продукти</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "30px 0 60px" }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Количка</h1>

      {lines.map((l) => (
        <div className="cart-row" key={`${l.productId}-${l.size}-${l.color}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.image} alt={l.name} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{l.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>Размер: {l.size} · Цвят: {l.color}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                min={1}
                value={l.qty}
                onChange={(e) => setQty(l.productId, l.size, l.color, parseInt(e.target.value) || 1)}
                style={{ width: 56, padding: 6 }}
              />
              <button className="btn btn--ghost btn--sm" onClick={() => remove(l.productId, l.size, l.color)}>
                Премахни
              </button>
            </div>
          </div>
          <div style={{ fontWeight: 700 }}>{formatBgn(l.priceBgn * l.qty)}</div>
        </div>
      ))}

      <div className="cart-totals">
        <table>
          <tbody>
            <tr><td>Общо (EUR)</td><td>{formatEur(totalEur)}</td></tr>
            <tr><td>Общо (BGN)</td><td>{formatBgn(totalBgn)}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Link href="/account/login?next=/checkout&guest=1" className="btn">Продължи към поръчката →</Link>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <TrustStrip variant="cart" />
      </div>
    </div>
  );
}
