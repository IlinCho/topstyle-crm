"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = { slug: string; name: string };
type CategoryNode = Category & { children: Category[] };

// Hamburger + search icons for the mobile header row (hidden on desktop,
// where the .nav row below the header is used instead - see globals.css
// "Mobile header controls" section). Kept as a client component because it
// needs open/close state; Header.tsx itself stays a server component that
// just fetches the category tree and passes it down.
export default function MobileNav({ tree }: { tree: CategoryNode[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function toggleMenu() {
    setMenuOpen((v) => !v);
    setSearchOpen(false);
  }
  function toggleSearch() {
    setSearchOpen((v) => !v);
    setMenuOpen(false);
  }
  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <div className="header-mobile-controls">
        <button type="button" className="icon-btn" aria-label="Меню" aria-expanded={menuOpen} onClick={toggleMenu}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button type="button" className="icon-btn" aria-label="Търсене" aria-expanded={searchOpen} onClick={toggleSearch}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {searchOpen && (
        <form className="mobile-search-bar" onSubmit={submitSearch}>
          <input
            type="text"
            name="q"
            placeholder="Търси продукти..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn">Търси</button>
        </form>
      )}

      {menuOpen && (
        <nav className="mobile-nav-panel">
          {tree.map((c) => (
            <div key={c.slug} className="mobile-nav-panel__item">
              <Link href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)}>{c.name}</Link>
              {c.children.length > 0 && (
                <div className="mobile-nav-panel__children">
                  {c.children.map((sub) => (
                    <Link key={sub.slug} href={`/category/${sub.slug}`} onClick={() => setMenuOpen(false)}>
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
