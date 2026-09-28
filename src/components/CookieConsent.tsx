"use client";

import { useEffect, useState } from "react";

// GDPR-style cookie notice - a single "Приемам" covers both the cookies
// strictly necessary to work (cart, login) and the marketing/analytics
// scripts in Analytics.tsx, which only start loading once this is accepted
// (never before - see the custom event dispatched below). Choice is
// remembered in localStorage so returning visitors don't see it again; if
// it's ever missing (private browsing, cleared storage) it just shows once
// more, which is fine.
const STORAGE_KEY = "ts_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. blocked) - just don't show the
      // banner rather than throwing and breaking the page.
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore - worst case the banner reappears next visit
    }
    setVisible(false);
    window.dispatchEvent(new Event("ts:cookie-consent-accepted"));
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent">
      <div className="container cookie-consent__inner">
        <p>
          Този сайт използва бисквитки, необходими за пазаруването (количка, вход в акаунт).
          С продължаване на разглеждането се съгласявате с тяхната употреба.
        </p>
        <button type="button" className="btn btn--sm" onClick={accept}>
          Приемам
        </button>
      </div>
    </div>
  );
}
