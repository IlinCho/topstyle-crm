"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartPill() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="cart-pill">
      Количка ({count})
    </Link>
  );
}
