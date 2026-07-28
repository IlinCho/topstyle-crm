"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import TrustStrip from "./TrustStrip";
import { TRUST_CONFIG } from "@/lib/trust-config";

type Variant = { size: string; color: string; stock: number };

export default function AddToCart({
  productId,
  slug,
  name,
  image,
  priceBgn,
  priceEur,
  variants,
}: {
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceBgn: number;
  priceEur: number;
  variants: Variant[];
}) {
  const { add } = useCart();
  const router = useRouter();
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  // No size is preselected - the customer must actively choose one before
  // an item can be added to the cart.
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const selectedVariant = variants.find((v) => v.size === size);
  const inStock = !size || (selectedVariant?.stock ?? 0) > 0;

  function selectSize(s: string) {
    setSize(s);
    setSizeError(false);
  }

  function handleAdd() {
    if (!size) {
      setSizeError(true);
      return;
    }
    if (!selectedVariant || selectedVariant.stock === 0) return;
    setSizeError(false);
    add({
      productId,
      name,
      slug,
      image,
      size,
      color: selectedVariant.color,
      priceBgn,
      priceEur,
      qty: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <div className="flex-between" style={{ alignItems: "baseline" }}>
        <p className="opt-label" style={{ margin: "18px 0 8px" }}>Размер</p>
        <button
          type="button"
          className="size-guide-link"
          onClick={() => setShowSizeGuide((v) => !v)}
        >
          Как да избера размер?
        </button>
      </div>
      {TRUST_CONFIG.sameDayCutoffTime && (
        <p className="urgency-line urgency-line--soft">
          🟢 Поръчай до {TRUST_CONFIG.sameDayCutoffTime} ч. и получи пратката още утре
        </p>
      )}
      <div className="opt-row">
        {sizes.map((s) => {
          const v = variants.find((vv) => vv.size === s);
          const disabled = !v || v.stock === 0;
          return (
            <div
              key={s}
              className={`opt ${size === s ? "selected" : ""} ${disabled ? "disabled" : ""}`}
              onClick={() => !disabled && selectSize(s)}
            >
              {s}
            </div>
          );
        })}
      </div>

      {showSizeGuide && (
        <div className="size-guide-box">
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Съвет за избор на размер</p>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Кроят е стандартен (regular fit). Ако сте между два размера, препоръчваме
            по-големия за по-свободно усещане. При въпроси за конкретни мерки — пишете ни
            преди поръчка на телефона в контактите.
          </p>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn" disabled={!inStock} onClick={handleAdd}>
          {size && !inStock ? "Изчерпан размер" : "Добави в количката"}
        </button>
        {added && (
          <button className="btn btn--ghost btn--sm" onClick={() => router.push("/cart")}>
            Виж количката →
          </button>
        )}
      </div>
      <p className="urgency-line urgency-line--soft" style={{ marginTop: 10 }}>
        🚚 Доставка с преглед и тест.
      </p>
      {sizeError && (
        <p className="error-text" style={{ marginTop: 10 }}>
          Моля, избери размер, преди да добавиш продукта в количката.
        </p>
      )}
      {added && <p style={{ color: "var(--brand-green)", fontSize: 13, marginTop: 10, fontWeight: 600 }}>✓ Добавено в количката.</p>}

      <div style={{ marginTop: 20 }}>
        <TrustStrip variant="product" />
      </div>

      {/* Sticky mobile CTA - only visible on small screens via CSS */}
      <div className="sticky-cta">
        <div className="sticky-cta__price">
          {priceBgn ? `${priceBgn.toFixed(2)} лв.` : ""}
        </div>
        <button className="btn" disabled={!inStock} onClick={handleAdd} style={{ flex: 1 }}>
          {size && !inStock ? "Изчерпан размер" : "Добави в количката"}
        </button>
      </div>
    </div>
  );
}
