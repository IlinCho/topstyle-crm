"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatBgn, formatEur } from "@/lib/format";
import TrustStrip from "@/components/TrustStrip";
import { useLiveStock } from "@/lib/useLiveStock";
import { isCriticalStock } from "@/lib/scarcity";

const STEPS = ["Лични данни", "Доставка", "Плащане", "Потвърждение"] as const;

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

type InitialCustomer = { id: string; name: string; email: string; phone: string } | null;
type FormStep = 1 | 2 | 3;

export default function CheckoutForm({ initialCustomer }: { initialCustomer: InitialCustomer }) {
  const { lines, totalBgn, totalEur, clear } = useCart();
  // Checkout stays quiet about stock by default (Priority 4 of the scarcity
  // rules) - this is only used to flag a line that's genuinely critical
  // (1 or 0 left) right before the customer confirms.
  const { getStock } = useLiveStock(lines.map((l) => l.productId));
  const [form, setForm] = useState({
    name: initialCustomer?.name || "",
    email: initialCustomer?.email || "",
    phone: initialCustomer?.phone || "",
    address: "",
    city: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_OPTIONS[0].id);
  const [officeName, setOfficeName] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // The checkout is a real 4-step wizard: only one step's fields are shown
  // at a time, matching the progress bar 1-to-1 (Лични данни / Доставка /
  // Плащане / Потвърждение), instead of showing everything on one long page.
  const [step, setStep] = useState<FormStep>(1);

  const activeIndex = placed ? 3 : step - 1; // 0-based index into STEPS for the progress bar

  // On mobile the step content is short, so switching steps (Назад/Продължи,
  // or landing on the confirmation screen) can leave the page scrolled down
  // exactly where it was - the customer sees new fields but not the progress
  // bar telling them which step they're on. Scroll back to the top of the
  // checkout on every step change so that's always visible. Skipped on the
  // very first render so loading the page doesn't itself trigger a jump.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, placed]);

  function goToStep(target: FormStep) {
    // Only allow jumping back to an already-completed step, never skipping ahead.
    if (placed || target >= step) return;
    setError("");
    setStep(target);
  }

  function goNextFromPersonal() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Моля попълнете име и телефон.");
      return;
    }
    setError("");
    setStep(2);
  }

  function goNextFromDelivery() {
    if (deliveryMethod === "econt_office" && !officeName.trim()) {
      setError("Моля посочете кой офис на Еконт е удобен за вас.");
      return;
    }
    if (deliveryMethod === "speedy_address" && !form.address.trim()) {
      setError("Моля попълнете адрес за доставка.");
      return;
    }
    if (!form.city.trim()) {
      setError("Моля попълнете град.");
      return;
    }
    setError("");
    setStep(3);
  }

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
          customerId: initialCustomer?.id || null,
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
        <CheckoutSteps activeIndex={3} onStepClick={() => {}} />
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
      <CheckoutSteps activeIndex={activeIndex} onStepClick={(i) => goToStep((i + 1) as FormStep)} />

      <h1 className="section-title" style={{ marginTop: 0 }}>Завършване на поръчката</h1>
      {initialCustomer && (
        <p className="muted" style={{ marginTop: -10, marginBottom: 20, fontSize: 13 }}>
          Влязъл си като {initialCustomer.email}.
        </p>
      )}

      <div className="pdp" style={{ alignItems: "start" }}>
        <div>
          {step === 1 && (
            <div className="card-box">
              <p className="opt-label" style={{ marginTop: 0 }}>Лични данни</p>
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
              {error && <p className="error-text">{error}</p>}
              <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={goNextFromPersonal}>
                Продължи към доставка →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="card-box">
              <p className="opt-label" style={{ marginTop: 0 }}>Начин на доставка</p>
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
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => goToStep(1)}>
                  ← Назад
                </button>
                <button className="btn" style={{ flex: 2 }} onClick={goNextFromDelivery}>
                  Продължи към плащане →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card-box">
              <p className="opt-label" style={{ marginTop: 0 }}>Плащане</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 0 }}>
                Плащане в брой при получаване (наложен платеж).
              </p>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => goToStep(2)} disabled={submitting}>
                  ← Назад
                </button>
                <button className="btn" style={{ flex: 2 }} onClick={placeOrder} disabled={submitting}>
                  {submitting ? "Изпращане..." : "Потвърди поръчката"}
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
                <TrustStrip variant="checkout" />
              </div>
            </div>
          )}
        </div>

        <div className="card-box" style={{ position: "sticky", top: 90 }}>
          <p className="opt-label" style={{ marginTop: 0 }}>Резюме на поръчката</p>
          {lines.map((l) => {
            const stock = getStock(l.productId, l.size, l.color);
            const critical = stock !== null && isCriticalStock(stock);
            return (
              <div
                key={`${l.productId}-${l.size}-${l.color}`}
                style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image} alt={l.name} style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 4, background: "var(--bg-soft)", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div className="muted">Размер: {l.size} · Цвят: {l.color} · × {l.qty}</div>
                  {critical && (
                    <div style={{ color: "var(--danger)", fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                      🔴 {stock === 0 ? "Изчерпан" : "Последен наличен брой"}
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{formatBgn(l.priceBgn * l.qty)}</span>
              </div>
            );
          })}
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

function CheckoutSteps({
  activeIndex,
  onStepClick,
}: {
  activeIndex: number;
  onStepClick: (i: number) => void;
}) {
  return (
    <ol className="checkout-progress">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const clickable = i < activeIndex;
        return (
          <li
            key={step}
            className={[
              "checkout-progress__step",
              done ? "checkout-progress__step--done" : "",
              active ? "checkout-progress__step--active" : "",
              clickable ? "checkout-progress__step--clickable" : "",
            ].join(" ").trim()}
            onClick={() => clickable && onStepClick(i)}
          >
            <span className="checkout-progress__line" />
            <span className="checkout-progress__dot">{done ? "✓" : i + 1}</span>
            <span className="checkout-progress__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
