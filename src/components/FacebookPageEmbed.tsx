"use client";

import { useEffect, useState } from "react";

// The Facebook Page plugin is itself a third-party embed that sets FB
// cookies once loaded - gated behind the same cookie-consent flow as the
// tracking scripts in Analytics.tsx (never loaded before "Приемам"), instead
// of showing a plain link before consent.
export default function FacebookPageEmbed({ pageUrl }: { pageUrl: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ts_cookie_consent")) setConsented(true);
    } catch {
      // localStorage unavailable - just keep showing the fallback link
    }
    function onAccept() {
      setConsented(true);
    }
    window.addEventListener("ts:cookie-consent-accepted", onAccept);
    return () => window.removeEventListener("ts:cookie-consent-accepted", onAccept);
  }, []);

  if (!consented) {
    return (
      <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="footer__fb-fallback">
        Разгледай ни във Facebook →
      </a>
    );
  }

  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=280&height=130&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;

  return (
    <div className="footer__fb-embed">
      <iframe
        src={src}
        width="280"
        height="130"
        style={{ border: "none", overflow: "hidden" }}
        scrolling="no"
        loading="lazy"
        allow="encrypted-media"
      />
    </div>
  );
}
