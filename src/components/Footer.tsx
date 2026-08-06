import Link from "next/link";
import { TRUST_CONFIG } from "@/lib/trust-config";

// Mirrors the original topstyle.bg footer structure (Полезни връзки /
// Свържете се с нас / Последвайте ни), using only real, verified values -
// the phone/social links below were pulled directly from the live site.
export default function Footer() {
  const phone = process.env.NEXT_PUBLIC_STORE_PHONE || "0877 968 927";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__cols">
          <div className="footer__col">
            <h3 className="footer__col-title">Полезни връзки</h3>
            <ul className="footer__links">
              <li><Link href="/account">Моят профил</Link></li>
              <li><Link href="/delivery">Доставка и плащане</Link></li>
              <li><Link href="/returns">Връщане и замяна</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__col-title">Свържете се с нас</h3>
            <ul className="footer__links">
              <li><strong>TopStyle.bg</strong></li>
              <li><a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></li>
              {TRUST_CONFIG.viberPhone && <li>Viber — {TRUST_CONFIG.viberPhone}</li>}
              {TRUST_CONFIG.contactEmail && <li><a href={`mailto:${TRUST_CONFIG.contactEmail}`}>{TRUST_CONFIG.contactEmail}</a></li>}
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__col-title">Последвайте ни</h3>
            <div className="footer__social">
              {TRUST_CONFIG.facebookUrl && (
                <a href={TRUST_CONFIG.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer__social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/></svg>
                  <span>Facebook</span>
                </a>
              )}
              {TRUST_CONFIG.instagramUrl && (
                <a href={TRUST_CONFIG.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43-.26.66-.6 1.21-1.15 1.76-.55.55-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47-.66-.26-1.21-.6-1.76-1.15-.55-.55-.9-1.1-1.15-1.76-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76.55-.55 1.1-.9 1.76-1.15.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.65.3-.42.16-.71.36-1.02.67-.31.31-.51.6-.67 1.02-.12.31-.26.78-.3 1.65-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.87.18 1.34.3 1.65.16.42.36.71.67 1.02.31.31.6.51 1.02.67.31.12.78.26 1.65.3 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.87-.04 1.34-.18 1.65-.3.42-.16.71-.36 1.02-.67.31-.31.51-.6.67-1.02.12-.31.26-.78.3-1.65.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.87-.18-1.34-.3-1.65-.16-.42-.36-.71-.67-1.02-.31-.31-.6-.51-1.02-.67-.31-.12-.78-.26-1.65-.3-1.05-.05-1.37-.06-4.04-.06zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm5.2-1.99a1.17 1.17 0 110 2.34 1.17 1.17 0 010-2.34z"/></svg>
                  <span>Instagram</span>
                </a>
              )}
            </div>
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
