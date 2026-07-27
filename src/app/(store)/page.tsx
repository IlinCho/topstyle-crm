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
        <div className="chip-row">
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
