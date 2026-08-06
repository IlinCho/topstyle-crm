import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { TRUST_CONFIG } from "@/lib/trust-config";
import { applyCategoryRankPins } from "@/lib/product-order";

export const dynamic = "force-dynamic";

// The 3 "top categories" shown under the hero, mirroring the original
// topstyle.bg homepage layout (Категория Мъжки тениски / Мъжки Якета /
// Мъжки Бански, each with "Виж повече"). Slugs match prisma/categories.json.
// Display labels are the original site's homepage marketing names, which
// differ slightly from the category record's own name (e.g. the category is
// just "Бански" but the homepage tile/section says "Мъжки Бански").
const HOME_CATEGORIES = [
  { slug: "mazhki-teniski", label: "Мъжки тениски" },
  { slug: "mzhki-yaketa", label: "Мъжки якета" },
  { slug: "banski", label: "Мъжки бански" },
] as const;

export default async function HomePage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });

  const authorityLine = [TRUST_CONFIG.yearsInBusinessText, TRUST_CONFIG.customersServedText]
    .filter(Boolean)
    .join(" · ");

  // For each of the 3 homepage categories: natural (newest-first) order, then
  // splice in admin-pinned products (categoryRank) at their exact slot - same
  // rule as the category page - then take the top 4. This is what makes the
  // homepage picks "regulируеми" (adjustable): the admin sets categoryRank
  // 1-4 on a product's edit page and it shows up here too, no separate
  // "homepage featured" field needed.
  const homeCategories = await Promise.all(
    HOME_CATEGORIES.map(async ({ slug, label }) => {
      const category = categories.find((c) => c.slug === slug);
      if (!category) return null;
      const naturalOrder = await db.product.findMany({
        where: { categoryId: category.id, active: true },
        include: { images: true, variants: true, reviews: true },
        orderBy: { createdAt: "desc" },
      });
      const products = applyCategoryRankPins(naturalOrder).slice(0, 4);
      const tileImage = category.imageUrl || products[0]?.images[0]?.url || "https://placehold.co/600x400/eeeeee/999999?text=TopStyle";
      return { category, label, products, tileImage };
    })
  );
  const validHomeCategories = homeCategories.filter((h): h is NonNullable<typeof h> => h !== null);

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
        <div className="category-tiles">
          {validHomeCategories.map(({ category, label, tileImage }) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="category-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tileImage} alt={label} className="category-tile__img" />
              <div className="category-tile__overlay">
                <span className="category-tile__label">Категория</span>
                <span className="category-tile__name">{label}</span>
                <span className="category-tile__cta">Виж повече →</span>
              </div>
            </Link>
          ))}
        </div>

        <div id="продукти">
          {validHomeCategories.map(({ category, label, products }) =>
            products.length === 0 ? null : (
              <section key={category.slug} className="top-products-section">
                <div className="flex-between" style={{ alignItems: "baseline" }}>
                  <h2 className="section-title">Топ {label}</h2>
                  <Link href={`/category/${category.slug}`} className="muted">Виж всички →</Link>
                </div>
                <div className="grid">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </>
  );
}
