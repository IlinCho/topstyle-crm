import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { categoryAndDescendantIds } from "@/lib/categories";
import { applyCategoryRankPins } from "@/lib/product-order";
import { isInStock } from "@/lib/scarcity";

export const dynamic = "force-dynamic";

type SearchParams = {
  size?: string | string[];
  material?: string | string[];
  color?: string | string[];
  priceMin?: string;
  priceMax?: string;
};

function toArray(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// Sizes are free text (not a fixed enum) - a product can use letter sizes
// (S/M/L/...) or numeric ones (42/44/...). Puts the known letter sizes in
// their natural order, numeric sizes after them in ascending order, and
// anything unrecognized last (alphabetically among itself).
const LETTER_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];
function sizeSortKey(s: string): number {
  const idx = LETTER_SIZE_ORDER.indexOf(s.toUpperCase());
  if (idx !== -1) return idx;
  const num = Number(s);
  if (!Number.isNaN(num)) return 100 + num;
  return 10000;
}
function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeSortKey(a) - sizeSortKey(b) || a.localeCompare(b));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const [allCategories, parent] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" } }),
    category.parentId ? db.category.findUnique({ where: { id: category.parentId } }) : null,
  ]);

  const subcategories = allCategories.filter((c) => c.parentId === category.id);

  // A parent category page also shows products from its subcategories, so
  // browsing "Мъжки тениски" doesn't hide everything filed under "Тениски с яка".
  const categoryIds = categoryAndDescendantIds(category, allCategories);

  // Natural order first (newest first), then splice in admin-pinned products
  // (categoryRank) at their exact target slot - see product-order.ts for why
  // a plain orderBy isn't enough for "position 4 really means 4th on the page".
  const naturalOrder = await db.product.findMany({
    where: { categoryId: { in: categoryIds }, active: true },
    include: { images: true, variants: true, reviews: true },
    orderBy: { createdAt: "desc" },
  });
  const allProducts = applyCategoryRankPins(naturalOrder.filter((p) => isInStock(p.variants)));

  // Filter option lists come from the category's full (unfiltered) product
  // set, so picking one filter never makes the others' checkboxes disappear.
  const sizes = sortSizes([...new Set(allProducts.flatMap((p) => p.variants.map((v) => v.size)).filter((v) => v))]);
  const materials = [...new Set(allProducts.map((p) => p.material).filter((v) => v))].sort();
  const colors = [...new Set(allProducts.map((p) => p.color).filter((v) => v))].sort();

  const selectedSizes = toArray(searchParams.size);
  const selectedMaterials = toArray(searchParams.material);
  const selectedColors = toArray(searchParams.color);
  const priceMin = searchParams.priceMin ? Number(searchParams.priceMin) : null;
  const priceMax = searchParams.priceMax ? Number(searchParams.priceMax) : null;

  const products = allProducts.filter((p) => {
    if (selectedSizes.length > 0 && !p.variants.some((v) => selectedSizes.includes(v.size) && v.stock > 0)) return false;
    if (selectedMaterials.length > 0 && !selectedMaterials.includes(p.material)) return false;
    if (selectedColors.length > 0 && !selectedColors.includes(p.color)) return false;
    if (priceMin !== null && !Number.isNaN(priceMin) && p.priceEur < priceMin) return false;
    if (priceMax !== null && !Number.isNaN(priceMax) && p.priceEur > priceMax) return false;
    return true;
  });

  const activeFilterCount =
    selectedSizes.length +
    selectedMaterials.length +
    selectedColors.length +
    (priceMin !== null && !Number.isNaN(priceMin) ? 1 : 0) +
    (priceMax !== null && !Number.isNaN(priceMax) ? 1 : 0);

  return (
    <div className="container">
      {parent && (
        <p style={{ margin: "24px 0 10px", fontSize: 13 }}>
          <Link href={`/category/${parent.slug}`} className="muted">{parent.name}</Link>
          {" / "}
          <span>{category.name}</span>
        </p>
      )}

      <h1 className="section-title" style={{ marginTop: parent ? 0 : 24 }}>
        {category.name} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>({products.length} продукта)</span>
      </h1>

      {subcategories.length > 0 && (
        <div className="chip-row">
          {subcategories.map((sub) => (
            <Link key={sub.slug} href={`/category/${sub.slug}`} className="chip">
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {(sizes.length > 0 || materials.length > 0 || colors.length > 0) && (
        <details className="filter-panel" open={activeFilterCount > 0}>
          <summary>
            Филтри
            {activeFilterCount > 0 && <span className="filter-panel__badge">{activeFilterCount}</span>}
          </summary>
          <form className="filter-panel__body" method="get">
            {sizes.length > 0 && (
              <div>
                <p className="filter-section__title">Размер</p>
                {sizes.map((s) => (
                  <label key={s} className="filter-checkbox-row">
                    <input type="checkbox" name="size" value={s} defaultChecked={selectedSizes.includes(s)} />
                    {s}
                  </label>
                ))}
              </div>
            )}

            {materials.length > 0 && (
              <div>
                <p className="filter-section__title">Материя</p>
                {materials.map((m) => (
                  <label key={m} className="filter-checkbox-row">
                    <input type="checkbox" name="material" value={m} defaultChecked={selectedMaterials.includes(m)} />
                    {m}
                  </label>
                ))}
              </div>
            )}

            {colors.length > 0 && (
              <div>
                <p className="filter-section__title">Цвят</p>
                {colors.map((c) => (
                  <label key={c} className="filter-checkbox-row">
                    <input type="checkbox" name="color" value={c} defaultChecked={selectedColors.includes(c)} />
                    {c}
                  </label>
                ))}
              </div>
            )}

            <div>
              <p className="filter-section__title">Цена (€)</p>
              <div className="filter-price-row">
                <input type="number" name="priceMin" placeholder="От" min={0} defaultValue={searchParams.priceMin || ""} />
                <span>—</span>
                <input type="number" name="priceMax" placeholder="До" min={0} defaultValue={searchParams.priceMax || ""} />
              </div>
            </div>

            <div className="filter-actions">
              <button type="submit" className="btn">Приложи</button>
              <Link href={`/category/${category.slug}`} className="filter-actions__clear">Изчисти филтрите</Link>
            </div>
          </form>
        </details>
      )}

      {products.length === 0 ? (
        <p className="muted">Няма продукти по зададените филтри.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
