import Link from "next/link";
import { TRUST_CONFIG } from "@/lib/trust-config";
import NewsletterForm from "./NewsletterForm";
import FacebookPageEmbed from "./FacebookPageEmbed";

export default async function Footer() {
  const phone = process.env.NEXT_PUBLIC_STORE_PHONE || "0877 968 927";
  const email = process.env.NEXT_PUBLIC_STORE_EMAIL || "office@topstyle.bg";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/topstyle.bg";
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/topstyle.bg";

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

        <div className="footer__cols footer__cols--4" style={{ marginTop: 28 }}>
          <div>
            <p className="footer__col-title footer__col-title--divider">Полезни връзки</p>
            <ul className="footer__bullet-links">
              <li><Link href="/account">Моят профил</Link></li>
              <li><Link href="/delivery-payment">Доставка и плащане</Link></li>
              <li><Link href="/returns">Връщане и замяна</Link></li>
              <li><Link href="/sitemap">Карта на сайта</Link></li>
            </ul>
          </div>

          <div>
            <p className="footer__col-title footer__col-title--divider">Свържете се с нас</p>
            <div className="footer__contact-rows">
              <p className="footer__contact-name">topstyle.bg</p>
              <div className="footer__contact-row">
                <PhoneIcon /> {phone}
              </div>
              <div className="footer__contact-row">
                <EnvelopeIcon /> {email}
              </div>
              <div className="footer__contact-row">
                <PhoneIcon /> Вайбър - {phone}
              </div>
            </div>
          </div>

          <div>
            <p className="footer__col-title footer__col-title--divider">Последвайте ни</p>
            <div className="footer__social-icons">
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
            </div>
            <FacebookPageEmbed pageUrl={facebookUrl} />
          </div>

          <div>
            <p className="footer__col-title footer__col-title--divider">Бюлетин</p>
            <NewsletterForm />
          </div>
        </div>

        <p className="muted mt-24">
          © {new Date().getFullYear()} TopStyle.bg. Всички права запазени.{" "}
          <Link href="/admin" className="footer__admin-link">Админ</Link>
        </p>
      </div>
    </footer>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
