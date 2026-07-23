"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  priceBgn: number;
  priceEur: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (productId: string, size: string, color: string) => void;
  setQty: (productId: string, size: string, color: string, qty: number) => void;
  clear: () => void;
  count: number;
  totalBgn: number;
  totalEur: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "topstyle_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function add(line: CartLine) {
    setLines((prev) => {
      const idx = prev.findIndex(
        (l) => l.productId === line.productId && l.size === line.size && l.color === line.color
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + line.qty };
        return copy;
      }
      return [...prev, line];
    });
  }

  function remove(productId: string, size: string, color: string) {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size && l.color === color)));
  }

  function setQty(productId: string, size: string, color: string, qty: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId && l.size === size && l.color === color ? { ...l, qty: Math.max(1, qty) } : l
      )
    );
  }

  function clear() {
    setLines([]);
  }

  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const totalBgn = lines.reduce((sum, l) => sum + l.qty * l.priceBgn, 0);
  const totalEur = lines.reduce((sum, l) => sum + l.qty * l.priceEur, 0);

  return (
    <CartContext.Provider value={{ lines, add, remove, setQty, clear, count, totalBgn, totalEur }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
