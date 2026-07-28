"use client";

import { useEffect, useState } from "react";

type StockMap = Record<string, number>;

function keyFor(productId: string, size: string, color: string) {
  return `${productId}::${size}::${color}`;
}

// Fetches real, current stock for a set of product ids from /api/stock and
// exposes a lookup keyed by productId+size+color. Used on the cart and
// checkout pages, which otherwise only know the stock snapshot from whenever
// the item was added to the (localStorage) cart - not what's true right now.
export function useLiveStock(productIds: string[]) {
  const [stock, setStock] = useState<StockMap>({});
  const [loaded, setLoaded] = useState(false);
  const key = Array.from(new Set(productIds)).sort().join(",");

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setStock({});
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: key.split(",") }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: StockMap = {};
        for (const v of data.variants || []) {
          map[keyFor(v.productId, v.size, v.color)] = v.stock;
        }
        setStock(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  function getStock(productId: string, size: string, color: string): number | null {
    const k = keyFor(productId, size, color);
    return k in stock ? stock[k] : null;
  }

  return { getStock, loaded };
}
