"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatBgn, formatEur } from "@/lib/format";
import TrustStrip from "@/components/TrustStrip";

const STEPS = ["Количка", "Доставка", "Плащане", "Готово"] as const;

const DELIVERY_OPTIONS = [
  {
    id: "econt_office",
    title: "Еконт — до офис",
    subtitle: "1–2 работни дни",
  },
  {
    id: "speedy_address",
    title: "Спиди — до адрес",
    subtitle: "1–2 работни дни",
  },
] as const;

export default function CheckoutPage() {
  const { lines, totalBgn, totalEur, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_OPTIONS[0].id);
  const [officeName, setOfficeName] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentStepIndex = placed ? 3 : 2; // this page always covers "Доставка" + "Плащане"

  async function placeOrder() {
    if (!form.name || !form.phone || !form.city) {
      setError("Моля попълнете име, телефон и град.");
      return;
    }
    if (deliveryMethod === "econt_office" && !officeName.trim()) {
      setError("Моля посочете кой офис на Еконт е удобен за вас.");
      return;
    }
    if (deliveryMethod === "speedy_address" && !form.address.trim()) {
      setError("Моля попълнете адрес за доставка.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          lines,
          delivery: { method: deliveryMethod, officeName: officeName.trim() },
        }),
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
      <div className="container" style={{ padding: "30px 0 60px" }}>
        <CheckoutSteps activeIndex={3} />
        <div style={{ padding: "30px 0" }}>
          <h1>Благодарим за поръчката!</h1>
          <p>Номер на поръчката: <strong>{placed}</strong></p>
          <p className="muted">Ще се свържем с вас за потвърждение на доставката.</p>
          <Link href="/" className="btn" style={{ marginTop: 20, display: "inline-block" }}>Обратно към магазина</Link>
        </div>
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
      <CheckoutSteps activeIndex={currentStepIndex} />

      <h1 className="section-title" style={{ marginTop: 0 }}>Завършване на поръчката</h1>

      <div className="pdp" style={{ alignItems: "start" }}>
        <div>
          <div className="card-box">
            <p className="opt-label" style={{ marginTop: 0 }}>1. Данни за връзка</p>
            <div className="field">
              <label>Име и фамилия</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Имейл (по избор)</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Телефон</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div className="card-box">
            <p className="opt-label" style={{ marginTop: 0 }}>2. Начин на доставка</p>
            <div className="delivery-cards">
              {DELIVERY_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`delivery-card ${deliveryMethod === opt.id ? "delivery-card--selected" : ""}`}
                  onClick={() => setDeliveryMethod(opt.id)}
                >
                  <div className="delivery-card__title">{opt.title}</div>
                  <div className="delivery-card__subtitle">{opt.subtitle}</div>
                </div>
              ))}
            </div>

            {deliveryMethod === "econt_office" ? (
              <div className="field" style={{ marginTop: 14 }}>
                <label>Офис на Еконт (град и адрес)</label>
                <input value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="напр. Еконт офис, ул. ... , София" />
              </div>
            ) : (
              <div className="field" style={{ marginTop: 14 }}>
                <label>Адрес за доставка</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Град</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            {deliveryMethod === "econt_office" && (
              <div className="field">
                <label>Адрес (по документ, ако е различен)</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="незадължително" />
              </div>
            )}
          </div>

          <div className="card-box">
            <p className="opt-label" style={{ marginTop: 0 }}>3. Плащане</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 0 }}>
              Плащане в брой при получаване (наложен платеж).
            </p>
            {error && <p className="error-text">{error}</p>}
            <button className="btn" style={{ width: "100%" }} onClick={placeOrder} disabled={submitting}>
              {submitting ? "Изпращане..." : "Завърши поръчката"}
            </button>
            <div style={{ marginTop: 16 }}>
              <TrustStrip variant="checkout" />
            </div>
          </div>
        </div>

        <div className="card-box" style={{ position: "sticky", top: 90 }}>
          <p className="opt-label" style={{ marginTop: 0 }}>Резюме на поръчката</p>
          {lines.map((l) => (
            <div
              key={`${l.productId}-${l.size}-${l.color}`}
              style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={l.name} style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 4, background: "var(--bg-soft)", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{l.name}</div>
                <div className="muted">Размер: {l.size} · Цвят: {l.color} · × {l.qty}</div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{formatBgn(l.priceBgn * l.qty)}</span>
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
          <Link href="/cart" className="muted" style={{ fontSize: 13 }}>← Обратно към количката</Link>
        </div>
      </div>
    </div>
  );
}

function CheckoutSteps({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="checkout-steps">
      {STEPS.map((step, i) => (
        <li key={step} className={i <= activeIndex ? "checkout-steps__item--done" : ""}>
          <span className="checkout-steps__dot">{i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
