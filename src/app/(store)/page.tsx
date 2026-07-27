import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { TRUST_CONFIG } from "@/lib/trust-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const newest = await db.product.findMany({
    where: { active: true },
    include: { images: true, variants: true, reviews: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const authorityLine = [TRUST_CONFIG.yearsInBusinessText, TRUST_CONFIG.customersServedText]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="hero">
        <h1>Мъжка мода, която усещаш</h1>
        <p>Качествени тениски, якета, дънки и ризи — с точния размер за теб, доставени до дни.</p>
        {authorityLine && <p className="hero__authority">{authorityLine}</p>}
        <ul className="hero__value-row">
          <li>✓ Плащане при доставка</li>
          <li>✓ Лесна замяна</li>
          <li>✓ Връщане до {TRUST_CONFIG.returnWindowDays} дни</li>
        </ul>
      </div>

      <div className="container">
        <div className="chip-row">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="chip">
              {c.name}
            </Link>
          ))}
        </div>

        <h2 className="section-title">Нови продукти</h2>
        <div className="grid">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </>
  );
}
