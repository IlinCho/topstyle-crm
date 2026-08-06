"use client";

import { useState } from "react";
import Link from "next/link";

type CategoryNode = {
  slug: string;
  name: string;
  children: { slug: string; name: string }[];
};

// Mobile-only hamburger + search controls (hidden on desktop via CSS - see
// .header-mobile-controls in globals.css), mirroring the original
// topstyle.bg mobile header. Needs to be a client component for the
// open/close state; Header.tsx itself stays a server component and just
// passes the already-fetched category tree down as a prop.
export default function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="header-mobile-controls">
        <button
          type="button"
          className="icon-btn"
          aria-label="Меню"
          aria-expanded={navOpen}
          onClick={() => {
            setNavOpen((v) => !v);
            setSearchOpen(false);
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Търсене"
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((v) => !v);
            setNavOpen(false);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {searchOpen && (
        <form action="/search" method="GET" className="mobile-search-bar">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input type="text" name="q" placeholder="Търси продукт..." autoFocus />
          <button type="submit" className="btn btn--sm">Търси</button>
        </form>
      )}

      {navOpen && (
        <nav className="mobile-nav-panel">
          {categories.map((c) => (
            <div key={c.slug} className="mobile-nav-panel__item">
              <Link href={`/category/${c.slug}`} onClick={() => setNavOpen(false)}>
                {c.name}
              </Link>
              {c.children.length > 0 && (
                <div className="mobile-nav-panel__children">
                  {c.children.map((sub) => (
                    <Link key={sub.slug} href={`/category/${sub.slug}`} onClick={() => setNavOpen(false)}>
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </>
  );
}
