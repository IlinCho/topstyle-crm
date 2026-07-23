"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatBgn, formatEur } from "@/lib/format";

export default function CartPage() {
  const { lines, remove, setQty, totalBgn, totalEur, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [placed, setPlaced] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function placeOrder() {
    if (!form.name || !form.phone || !form.address || !form.city) {
      setError("Моля попълнете име, телефон, адрес и град.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Грешка при поръчката");
      setPlaced(data.orderNumber);
      clear();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <div className="container" style={{ padding: "60px 0" }}>
        <h1>Благодарим за поръчката!</h1>
        <p>Номер на поръчката: <strong>{placed}</strong></p>
        <p className="muted">Ще се свържем с вас за потвърждение на доставката.</p>
        <Link href="/" className="btn" style={{ marginTop: 20, display: "inline-block" }}>Обратно към магазина</Link>
      </div>
    );
  }

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

      <div className="card-box mt-24" style={{ maxWidth: 480, marginLeft: "auto" }}>
        <p className="opt-label" style={{ marginTop: 0 }}>Данни за доставка</p>
        <div className="field">
          <label>Име и фамилия</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Имейл</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Телефон</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Адрес</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="field">
          <label>Град</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" style={{ width: "100%" }} onClick={placeOrder} disabled={submitting}>
          {submitting ? "Изпращане..." : "Завърши поръчката (наложен платеж)"}
        </button>
      </div>
    </div>
  );
}
