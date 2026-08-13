"use client";

import { useRef, useState } from "react";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const safeImages = images.length
    ? images
    : ["https://placehold.co/600x750/eeeeee/999999?text=TopStyle"];
  const [selected, setSelected] = useState(0);

  // Hover-zoom on desktop (like the original site's product page): moving
  // the cursor over the image reveals a zoomed-in crop under the pointer via
  // a background-position pan on an overlay layer - the base <img> never
  // changes size, so this can't cause layout shift. Hidden on touch devices
  // via CSS (hover: none), since there's no cursor to track there.
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const wrapRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  return (
    <div>
      <div
        ref={wrapRef}
        className="pdp__img-wrap"
        onMouseEnter={() => setZoomActive(true)}
        onMouseLeave={() => setZoomActive(false)}
        onMouseMove={handleMouseMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={safeImages[selected]} alt={alt} className="pdp__img" />
        {zoomActive && (
          <div
            className="pdp__img-zoom"
            style={{
              backgroundImage: `url(${safeImages[selected]})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        )}
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
