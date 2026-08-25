// Smart Scarcity Intelligence - single source of truth for turning REAL
// per-variant stock numbers into a customer-facing message.
//
// Hard rule: every message here is a direct function of the actual `stock`
// value passed in. There is no path that lets a page invent its own copy or
// its own thresholds - that's what prevents the classic "Last 2 left!" on
// every single product regardless of truth (fake scarcity), which destroys
// trust rather than building it.

export type ScarcityTone = "ok" | "info" | "warn" | "danger" | "out";

export type ScarcityInfo = {
  tier: "plenty" | "limited" | "few" | "very-few" | "last" | "out";
  icon: string;
  text: string;
  tone: ScarcityTone;
};

export function getScarcity(stock: number): ScarcityInfo {
  if (stock <= 0) return { tier: "out", icon: "⛔", text: "Изчерпан", tone: "out" };
  if (stock === 1) return { tier: "last", icon: "🔴", text: "Последен наличен брой", tone: "danger" };
  if (stock <= 4) return { tier: "very-few", icon: "🟠", text: `Остават само ${stock} броя`, tone: "warn" };
  if (stock <= 9) return { tier: "few", icon: "🟠", text: "Остават няколко броя", tone: "warn" };
  if (stock <= 20) return { tier: "limited", icon: "🟡", text: "Ограничена наличност", tone: "info" };
  return { tier: "plenty", icon: "✔", text: "В наличност", tone: "ok" };
}

// Checkout should stay quiet unless a line is genuinely at risk - showing a
// scarcity nudge on every single line at the final step would just add noise
// (and start to feel manipulative), so this gate is intentionally strict.
export function isCriticalStock(stock: number): boolean {
  return stock <= 1;
}

// A short, compact label for tight spaces (size chips) - just the count for
// low tiers, nothing for plenty/limited so we don't clutter every chip.
export function getCompactStockHint(stock: number): string | null {
  if (stock <= 0) return null; // chip already shows disabled/out state
  if (stock <= 4) return `${stock} бр.`;
  if (stock <= 9) return "малко";
  return null;
}

// Category/homepage browse listings hide fully sold-out products, matching
// the old PrestaShop storefront's default behavior (which auto-hides
// out-of-stock active products from category pages). The individual product
// page and search results stay unfiltered - someone with a direct link or
// searching by name/SKU should still be able to find and view it, marked
// "Изчерпан", same as before.
export function isInStock(variants: { stock: number }[]): boolean {
  return variants.reduce((sum, v) => sum + v.stock, 0) > 0;
}
