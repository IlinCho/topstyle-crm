"use client";

import { useEffect } from "react";

// Marketing/analytics scripts - only loaded once the visitor has accepted
// the cookie notice (see CookieConsent.tsx), and only for whichever IDs are
// actually set as env vars (empty/unset = that tracker is skipped entirely).
// Set up the real accounts, add the env vars in Vercel, redeploy - no other
// code changes needed. Mirrors the same gating logic in php-site's
// includes/footer.php so both stacks behave identically.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string };
    clarity?: (...args: unknown[]) => void;
  }
}

let trackersLoaded = false;

function loadTrackers() {
  if (trackersLoaded) return;
  trackersLoaded = true;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
  }

  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  if (fbPixelId) {
    (function (f: any, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s0 = b.getElementsByTagName(e)[0];
      s0.parentNode!.insertBefore(t, s0);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq!("init", fbPixelId);
    window.fbq!("track", "PageView");
  }

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (gtmId) {
    (function (w: any, d: Document, s: string, l: string, i: string) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s) as HTMLScriptElement;
      const dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode!.insertBefore(j, f);
    })(window, document, "script", "dataLayer", gtmId);
  }

  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (clarityId) {
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode!.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);
  }
}

export default function Analytics() {
  useEffect(() => {
    try {
      if (localStorage.getItem("ts_cookie_consent")) {
        loadTrackers();
      }
    } catch {
      // localStorage unavailable - just skip, same as CookieConsent
    }
    window.addEventListener("ts:cookie-consent-accepted", loadTrackers);
    return () => window.removeEventListener("ts:cookie-consent-accepted", loadTrackers);
  }, []);

  return null;
}
