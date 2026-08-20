"use client";

import { useRef, useState } from "react";

// Hover-zoom (desktop only, like the original site's product page): moving
// the cursor over the image pans a zoomed-in overlay's background-position
// to follow it. Mirrors php-site/product.php's tsPdpZoomEnter/Leave/Move -
// the CSS (.pdp__img-zoom, hidden under `(hover: none)`) already handles
// hiding this on touch devices, so no separate touch check is needed here.
export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const safeImages = images.length ? images : ["https://placehold.co/600x750/eeeeee/999999?text=TopStyle"];
  const [selected, setSelected] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const wrapRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }

  return (
    <div>
      <div
        ref={wrapRef}
        className="pdp__img-wrap"
        onMouseEnter={() => setZoomVisible(true)}
        onMouseLeave={() => setZoomVisible(false)}
        onMouseMove={handleMouseMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={safeImages[selected]} alt={alt} className="pdp__img" />
        <div
          className="pdp__img-zoom"
          style={{
            display: zoomVisible ? "block" : "none",
            backgroundImage: `url('${safeImages[selected]}')`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
          }}
        />
      </div>
      {safeImages.length > 1 && (
        <div className="pdp__thumbs">
          {safeImages.map((url, idx) => (
            <button
              key={idx}
              type="button"
              className={`pdp__thumb${idx === selected ? " pdp__thumb--active" : ""}`}
              onClick={() => setSelected(idx)}
              aria-label={`Снимка ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
