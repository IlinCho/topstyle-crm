// Category-page filter facets (size / color / material / price) - computed
// from whatever product set is currently in scope (a category + its
// subcategories) so counts always reflect what's actually on that page,
// same spirit as the original topstyle.bg PrestaShop filter sidebar but
// scoped down to this catalog's size (166 products total vs. PrestaShop's
// per-category counts in the hundreds).

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "XXXL"];

export type FacetOption = { value: string; count: number };

export type ProductForFacets = {
  material: string;
  priceBgn: number;
  variants: { size: string; color: string }[];
};

export type Facets = {
  sizes: FacetOption[];
  colors: FacetOption[];
  materials: FacetOption[];
  priceMin: number;
  priceMax: number;
};

function sortBySize(a: FacetOption, b: FacetOption) {
  const ia = SIZE_ORDER.indexOf(a.value);
  const ib = SIZE_ORDER.indexOf(b.value);
  if (ia === -1 && ib === -1) return a.value.localeCompare(b.value, "bg");
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

// Facets are computed from the pre-filter product set (everything in the
// category), not re-narrowed as filters are applied - a deliberate
// simplification vs. PrestaShop's live-updating counts, since re-computing
// per-facet-excluding-itself counts adds real complexity for little benefit
// at this catalog size.
export function computeFacets(products: ProductForFacets[]): Facets {
  const sizeCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const materialCounts = new Map<string, number>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of products) {
    const sizes = new Set(p.variants.map((v) => v.size).filter(Boolean));
    const colors = new Set(p.variants.map((v) => v.color).filter(Boolean));
    sizes.forEach((s) => sizeCounts.set(s, (sizeCounts.get(s) || 0) + 1));
    colors.forEach((c) => colorCounts.set(c, (colorCounts.get(c) || 0) + 1));
    if (p.material) materialCounts.set(p.material, (materialCounts.get(p.material) || 0) + 1);
    if (p.priceBgn < priceMin) priceMin = p.priceBgn;
    if (p.priceBgn > priceMax) priceMax = p.priceBgn;
  }

  const toOptions = (m: Map<string, number>) =>
    [...m.entries()].map(([value, count]) => ({ value, count }));

  return {
    sizes: toOptions(sizeCounts).sort(sortBySize),
    colors: toOptions(colorCounts).sort((a, b) => a.value.localeCompare(b.value, "bg")),
    materials: toOptions(materialCounts).sort((a, b) => a.value.localeCompare(b.value, "bg")),
    priceMin: products.length ? Math.floor(priceMin) : 0,
    priceMax: products.length ? Math.ceil(priceMax) : 0,
  };
}

export type ProductFilters = {
  sizes: string[];
  colors: string[];
  materials: string[];
  minPrice?: number;
  maxPrice?: number;
};

// Within one facet type = OR (e.g. size M or L). Across facet types = AND
// (e.g. size M/L AND color черен) - standard faceted-search semantics.
export function applyProductFilters<T extends ProductForFacets>(products: T[], filters: ProductFilters): T[] {
  return products.filter((p) => {
    if (filters.sizes.length && !p.variants.some((v) => filters.sizes.includes(v.size))) return false;
    if (filters.colors.length && !p.variants.some((v) => filters.colors.includes(v.color))) return false;
    if (filters.materials.length && !filters.materials.includes(p.material)) return false;
    if (filters.minPrice != null && p.priceBgn < filters.minPrice) return false;
    if (filters.maxPrice != null && p.priceBgn > filters.maxPrice) return false;
    return true;
  });
}

export function toArrayParam(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
