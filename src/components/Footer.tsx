import Link from "next/link";
import { db } from "@/lib/db";
import { TRUST_CONFIG } from "@/lib/trust-config";

export default async function Footer() {
  const topCategories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    take: 6,
  });

  const phone = process.env.NEXT_PUBLIC_STORE_PHONE || "0877 968 927";
  // Leave empty until real social profiles are provided - same "no
  // fabricated facts" rule as TRUST_CONFIG. The block just doesn't render
  // when both are unset.
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";

  return (
    <footer className="site-footer">
      <div className="container">
        <ul className="trust-strip">
          {TRUST_CONFIG.customersServedText && (
            <li><span className="trust-strip__check">✓</span> {TRUST_CONFIG.customersServedText}</li>
          )}
          <li><span className="trust-strip__check">✓</span> Сигурно връщане до {TRUST_CONFIG.returnWindowDays} дни</li>
          <li><span className="trust-strip__check">✓</span> Доставка до 24 часа</li>
          <li><span className="trust-strip__check">✓</span> Преглед и тест при получаване</li>
        </ul>

        <div className="footer__cols" style={{ marginTop: 28 }}>
          <div>
            <p className="footer__col-title">TopStyle.bg</p>
            <ul className="footer__links">
              <li>Мъжка мода с характер</li>
              <li>Тел: {phone}</li>
            </ul>
          </div>

          <div>
            <p className="footer__col-title">Категории</p>
            <ul className="footer__links">
              {topCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="footer__col-title">Информация</p>
            <ul className="footer__links">
              <li><Link href="/account/login">Вход / Регистрация</Link></li>
              <li><Link href="/cart">Количка</Link></li>
              <li><Link href="/admin" className="footer__admin-link">Админ</Link></li>
            </ul>
            {(facebookUrl || instagramUrl) && (
              <div className="footer__social" style={{ marginTop: 12 }}>
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="footer__social-link">
                    Facebook
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="footer__social-link">
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="muted mt-24">© {new Date().getFullYear()} TopStyle.bg. Всички права запазени.</p>
      </div>
    </footer>
  );
}
