"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

export default function CartPill() {
  const { count } = useCart();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip the very first render (e.g. cart hydrating from localStorage) so
    // the animation only fires when an item is actually added while the
    // user is looking at the page, not on every page load.
    if (firstRun.current) {
      firstRun.current = false;
      prevCount.current = count;
      return;
    }
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 550);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <Link href="/cart" className={`cart-pill ${bump ? "cart-pill--bump" : ""}`}>
      Количка ({count})
    </Link>
  );
}
