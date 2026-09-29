import Link from "next/link";
import { db } from "@/lib/db";
import { buildCategoryTree } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта на сайта — TopStyle.bg" };

export default async function SitemapPage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const tree = buildCategoryTree(categories);

  return (
    <div className="container" style={{ padding: "30px 0 60px", maxWidth: 760 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Карта на сайта</h1>

      <div className="card-box">
        <p className="footer__col-title" style={{ marginTop: 0 }}>Категории</p>
        <ul className="footer__links">
          {tree.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`}>{c.name}</Link>
              {c.children.length > 0 && (
                <ul className="footer__links" style={{ marginTop: 8, marginLeft: 16 }}>
                  {c.children.map((sub) => (
                    <li key={sub.slug}>
                      <Link href={`/category/${sub.slug}`}>{sub.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-box" style={{ marginTop: 16 }}>
        <p className="footer__col-title" style={{ marginTop: 0 }}>Страници</p>
        <ul className="footer__links">
          <li><Link href="/">Начало</Link></li>
          <li><Link href="/search">Търсене</Link></li>
          <li><Link href="/cart">Количка</Link></li>
          <li><Link href="/account">Моят профил</Link></li>
          <li><Link href="/delivery-payment">Доставка и плащане</Link></li>
          <li><Link href="/returns">Връщане и замяна</Link></li>
        </ul>
      </div>
    </div>
  );
}
