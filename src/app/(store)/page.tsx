import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { TRUST_CONFIG } from "@/lib/trust-config";
import { categoryAndDescendantIds } from "@/lib/categories";
import { applyCategoryRankPins } from "@/lib/product-order";
import { isInStock } from "@/lib/scarcity";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  // Homepage tiles show exactly the first 3 top-level categories ("Топ
  // категории") - matches the original site's compact 3-tile row and the
  // .category-tiles grid (repeat(3, 1fr)) in globals.css.
  const topCategories = categories.filter((c) => !c.parentId).slice(0, 3);

  // For each top category, pull its best products (subcategories included,
  // admin categoryRank pins applied - same merchandising logic as the
  // category page itself) to show as a "Топ продукти" preview row, and to
  // fall back to a real product photo for the tile image when the admin
  // hasn't uploaded one for the category yet.
  const topCategorySections = await Promise.all(
    topCategories.map(async (c) => {
      const categoryIds = categoryAndDescendantIds(c, categories);
      const naturalOrder = await db.product.findMany({
        where: { categoryId: { in: categoryIds }, active: true },
        include: { images: true, variants: true, reviews: true },
        orderBy: { createdAt: "desc" },
      });
      const products = applyCategoryRankPins(naturalOrder.filter((p) => isInStock(p.variants))).slice(0, 4);
      const tileImage = c.imageUrl || products[0]?.images[0]?.url || "";
      return { category: c, products, tileImage };
    })
  );

  // Fetch a buffer beyond the 8 we'll actually show, since some of the
  // newest-first results may be sold out and get filtered below.
  const newestCandidates = await db.product.findMany({
    where: { active: true },
    include: { images: true, variants: true, reviews: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const newest = newestCandidates.filter((p) => isInStock(p.variants)).slice(0, 8);

  const authorityLine = [TRUST_CONFIG.yearsInBusinessText, TRUST_CONFIG.customersServedText]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="hero">
        <div className="hero__split">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-photo.jpg" alt="TopStyle.bg" className="hero__photo" />
          <div className="hero__panel">
            <h1>Усети тръпката да бъдеш модерен</h1>
            <p>Твоят стил, твоите дрехи</p>
            {authorityLine && <p className="hero__authority">{authorityLine}</p>}
            <ul className="hero__value-row">
              <li>✓ Плащане при доставка</li>
              <li>✓ Лесна замяна</li>
              <li>✓ Връщане до {TRUST_CONFIG.returnWindowDays} дни</li>
            </ul>
            <div className="hero__cta">
              <Link href="#продукти" className="btn">Пазарувай сега</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {topCategories.length > 0 && (
          <div className="category-tiles">
            {topCategorySections.map(({ category: c, tileImage }) => {
              const tileTitle = c.homeTileTitle || c.name;
              return (
                <Link key={c.slug} href={`/category/${c.slug}`} className="category-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tileImage || "https://placehold.co/600x450/eeeeee/999999?text=TopStyle"}
                    alt={tileTitle}
                    className="category-tile__img"
                  />
                  <div className="category-tile__overlay">
                    <span className="category-tile__label">Категория</span>
                    <span className="category-tile__name">{tileTitle}</span>
                    <span className="category-tile__cta">Разгледай →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {topCategorySections.map(({ category: c, products }) =>
          products.length > 0 ? (
            <div className="top-products-section" key={c.id}>
              <div className="flex-between">
                <h2 className="section-title">{c.name}</h2>
                <Link href={`/category/${c.slug}`} className="muted" style={{ fontSize: 13 }}>
                  Виж всички →
                </Link>
              </div>
              <div className="grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : null
        )}

        <div className="chip-row" style={{ marginTop: 44 }}>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="chip">
              {c.name}
            </Link>
          ))}
        </div>

        <h2 className="section-title" id="продукти">Нови продукти</h2>
        <div className="grid">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </>
  );
}
