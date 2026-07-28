import Link from "next/link";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { buildCategoryTree } from "@/lib/categories";
import CartPill from "./CartPill";

export default async function Header() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const tree = buildCategoryTree(categories);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "TopStyle.bg";
  const session = await getCustomerSession();

  return (
    <header className="site-header">
      <div className="container site-header__top">
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/topstyle-logo-wordmark.png" alt="TopStyle.bg" className="logo__img" />
        </Link>
        <div className="header-actions">
          <Link href={session ? "/account" : "/account/login"}>
            {session ? "Моят профил" : "Вход"}
          </Link>
          <CartPill />
        </div>
      </div>
      <nav className="container nav">
        {tree.map((c) => (
          <div key={c.slug} className="nav__item">
            <Link href={`/category/${c.slug}`}>{c.name}</Link>
            {c.children.length > 0 && (
              <div className="nav__dropdown">
                {c.children.map((sub) => (
                  <Link key={sub.slug} href={`/category/${sub.slug}`}>
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
