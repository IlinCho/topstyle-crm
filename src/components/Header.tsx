import Link from "next/link";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import CartPill from "./CartPill";

export default async function Header() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
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
