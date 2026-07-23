import Link from "next/link";
import { db } from "@/lib/db";
import CartPill from "./CartPill";

export default async function Header() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "TopStyle.bg";

  return (
    <header className="site-header">
      <div className="container site-header__top">
        <Link href="/" className="logo">
          Top<span>Style</span>.bg
        </Link>
        <div className="header-actions">
          <Link href="/admin">Админ</Link>
          <CartPill />
        </div>
      </div>
      <nav className="container nav">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`}>
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
