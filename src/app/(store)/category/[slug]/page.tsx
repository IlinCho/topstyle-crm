import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { categoryAndDescendantIds } from "@/lib/categories";
import { applyCategoryRankPins } from "@/lib/product-order";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const [allCategories, parent] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" } }),
    category.parentId ? db.category.findUnique({ where: { id: category.parentId } }) : null,
  ]);

  const topLevelCategories = allCategories.filter((c) => !c.parentId);
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
  const products = applyCategoryRankPins(naturalOrder);

  return (
    <div className="container">
      <div className="chip-row" style={{ marginTop: 24 }}>
        {topLevelCategories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`chip ${c.slug === category.slug || c.id === category.parentId ? "active" : ""}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {parent && (
        <p style={{ margin: "0 0 10px", fontSize: 13 }}>
          <Link href={`/category/${parent.slug}`} className="muted">{parent.name}</Link>
          {" / "}
          <span>{category.name}</span>
        </p>
      )}

      <h1 className="section-title" style={{ marginTop: 0 }}>
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

      {products.length === 0 ? (
        <p className="muted">Все още няма продукти в тази категория.</p>
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
