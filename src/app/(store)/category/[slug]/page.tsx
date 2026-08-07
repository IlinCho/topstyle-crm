import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { categoryAndDescendantIds } from "@/lib/categories";
import { applyCategoryRankPins } from "@/lib/product-order";
import { computeFacets, applyProductFilters, toArrayParam } from "@/lib/product-filters";

export const dynamic = "force-dynamic";

type SearchParams = {
  sub?: string;
  size?: string | string[];
  color?: string | string[];
  material?: string | string[];
  minPrice?: string;
  maxPrice?: string;
};

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

  const selectedSub = subcategories.find((s) => s.slug === searchParams.sub);
  const scoped = selectedSub ? naturalOrder.filter((p) => p.categoryId === selectedSub.id) : naturalOrder;

  const facets = computeFacets(scoped);

  const selectedSizes = toArrayParam(searchParams.size);
  const selectedColors = toArrayParam(searchParams.color);
  const selectedMaterials = toArrayParam(searchParams.material);
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;

  const filtered = applyProductFilters(scoped, {
    sizes: selectedSizes,
    colors: selectedColors,
    materials: selectedMaterials,
    minPrice,
    maxPrice,
  });
  const products = applyCategoryRankPins(filtered);

  const hasActiveFilters =
    Boolean(selectedSub) || selectedSizes.length > 0 || selectedColors.length > 0 || selectedMaterials.length > 0 || minPrice != null || maxPrice != null;

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

      <details className="filter-panel">
        <summary>
          Филтри {hasActiveFilters && <span className="filter-panel__badge">активни</span>}
        </summary>
        <form method="GET" action={`/category/${category.slug}`} className="filter-panel__body">
          {subcategories.length > 0 && (
            <div className="filter-section">
              <div className="filter-section__title">Категории</div>
              <label className="filter-checkbox-row">
                <input type="radio" name="sub" value="" defaultChecked={!selectedSub} />
                Всички
              </label>
              {subcategories.map((sub) => (
                <label key={sub.slug} className="filter-checkbox-row">
                  <input type="radio" name="sub" value={sub.slug} defaultChecked={selectedSub?.slug === sub.slug} />
                  {sub.name}
                </label>
              ))}
            </div>
          )}

          <div className="filter-section">
            <div className="filter-section__title">Цена (лв.)</div>
            <div className="filter-price-row">
              <input type="number" name="minPrice" placeholder={String(facets.priceMin)} defaultValue={searchParams.minPrice || ""} min={0} />
              <span>—</span>
              <input type="number" name="maxPrice" placeholder={String(facets.priceMax)} defaultValue={searchParams.maxPrice || ""} min={0} />
            </div>
          </div>

          {facets.sizes.length > 0 && (
            <div className="filter-section">
              <div className="filter-section__title">Размер</div>
              {facets.sizes.map((opt) => (
                <label key={opt.value} className="filter-checkbox-row">
                  <input type="checkbox" name="size" value={opt.value} defaultChecked={selectedSizes.includes(opt.value)} />
                  {opt.value} <span className="muted">({opt.count})</span>
                </label>
              ))}
            </div>
          )}

          {facets.colors.length > 0 && (
            <div className="filter-section">
              <div className="filter-section__title">Цвят</div>
              {facets.colors.map((opt) => (
                <label key={opt.value} className="filter-checkbox-row">
                  <input type="checkbox" name="color" value={opt.value} defaultChecked={selectedColors.includes(opt.value)} />
                  {opt.value} <span className="muted">({opt.count})</span>
                </label>
              ))}
            </div>
          )}

          {facets.materials.length > 0 && (
            <div className="filter-section">
              <div className="filter-section__title">Състав</div>
              {facets.materials.map((opt) => (
                <label key={opt.value} className="filter-checkbox-row">
                  <input type="checkbox" name="material" value={opt.value} defaultChecked={selectedMaterials.includes(opt.value)} />
                  {opt.value} <span className="muted">({opt.count})</span>
                </label>
              ))}
            </div>
          )}

          <div className="filter-actions">
            <Link href={`/category/${category.slug}`} className="filter-actions__clear">Изчисти</Link>
            <button type="submit" className="btn">Приложи филтри</button>
          </div>
        </form>
      </details>

      {products.length === 0 ? (
        <p className="muted">Няма продукти, отговарящи на избраните филтри.</p>
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
