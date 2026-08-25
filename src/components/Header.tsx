import Link from "next/link";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { buildCategoryTree } from "@/lib/categories";
import CartPill from "./CartPill";
import MobileNav from "./MobileNav";

export default async function Header() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const tree = buildCategoryTree(categories);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "TopStyle.bg";
  const session = await getCustomerSession();

  return (
    <header className="site-header">
      <div className="container site-header__top">
        <MobileNav
          tree={tree.map((c) => ({
            slug: c.slug,
            name: c.name,
            children: c.children.map((sub) => ({ slug: sub.slug, name: sub.name })),
          }))}
        />
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
        <div className="nav__categories">
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
        </div>
        <form action="/search" method="get" className="nav__search">
          <input type="text" name="q" placeholder="Търси по име или код..." />
          <button type="submit" aria-label="Търси">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </nav>
    </header>
  );
}
