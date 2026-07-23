export function formatBgn(value: number) {
  return `${value.toFixed(2)} лв.`;
}

export function formatEur(value: number) {
  return `${value.toFixed(2)} €`;
}

export function formatPrice(priceEur: number, priceBgn: number) {
  return `${formatEur(priceEur)} / ${formatBgn(priceBgn)}`;
}

export function slugifyBasic(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-я\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
