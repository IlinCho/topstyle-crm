// Manual, admin-controlled product badges. Deliberately NOT auto-derived
// from sales/view data we don't actually have - the client picks these
// themselves for each product, so the claim is always true to their intent.

export const BADGE_DEFS = [
  { key: "bestseller", label: "Бестселър", className: "badge--bestseller" },
  { key: "new", label: "Нов", className: "badge--new" },
  { key: "limited", label: "Ограничена бройка", className: "badge--limited" },
  { key: "most_popular", label: "Най-търсен", className: "badge--popular" },
] as const;

export type BadgeKey = (typeof BADGE_DEFS)[number]["key"];

export function parseBadges(value: string | null | undefined): BadgeKey[] {
  if (!value) return [];
  const known = new Set(BADGE_DEFS.map((b) => b.key));
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is BadgeKey => known.has(s as BadgeKey));
}

export function serializeBadges(keys: string[]): string {
  const known = new Set(BADGE_DEFS.map((b) => b.key));
  return keys.filter((k) => known.has(k as BadgeKey)).join(",");
}
