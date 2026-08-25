export function formatBgn(value: number) {
  return `${value.toFixed(2)} лв.`;
}

export function formatEur(value: number) {
  return `${value.toFixed(2)} €`;
}

export function formatPrice(priceEur: number, priceBgn: number) {
  return `${formatEur(priceEur)} / ${formatBgn(priceBgn)}`;
}

// Date + time for admin order listings - "24.08.2026, 14:32" style, so it's
// clear at a glance not just which day but roughly when an order came in
// (useful for spotting quick/urgent orders placed late at night, etc.).
export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = d.toLocaleDateString("bg-BG");
  const timePart = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

// Bulgarian Cyrillic -> Latin transliteration, so slugs are always plain
// ASCII (same convention as the original scraped catalog's slugs, e.g.
// "mazhka-teniska-..."). The previous version of this function kept Cyrillic
// characters as-is, which produced non-ASCII slugs for any admin-created
// product - those slugs round-trip through the browser's URL encoding and
// can end up not matching the stored value, causing a 404 on the product
// page even though the product exists. Transliterating avoids the whole
// class of problem by keeping slugs plain a-z0-9- only.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function slugifyBasic(input: string) {
  const lower = input.toLowerCase().trim();
  const transliterated = lower.replace(/[а-я]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? "");
  return transliterated
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
