"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

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
  const [size, setSize] = useState(sizes[0] || "");
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.size === size);
  const inStock = (selectedVariant?.stock ?? 0) > 0;

  function handleAdd() {
    if (!selectedVariant || !inStock) return;
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
      <p className="opt-label">Размер</p>
      <div className="opt-row">
        {sizes.map((s) => {
          const v = variants.find((vv) => vv.size === s);
          const disabled = !v || v.stock === 0;
          return (
            <div
              key={s}
              className={`opt ${size === s ? "selected" : ""} ${disabled ? "disabled" : ""}`}
              onClick={() => !disabled && setSize(s)}
            >
              {s}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn" disabled={!inStock} onClick={handleAdd}>
          {inStock ? "Добави в количката" : "Изчерпан размер"}
        </button>
        {added && (
          <button className="btn btn--ghost btn--sm" onClick={() => router.push("/cart")}>
            Виж количката →
          </button>
        )}
      </div>
      {added && <p style={{ color: "#1f7a3d", fontSize: 13, marginTop: 10 }}>Добавено в количката.</p>}
    </div>
  );
}
