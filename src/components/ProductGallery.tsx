"use client";

import { useState } from "react";

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

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={safeImages[selected]} alt={alt} className="pdp__img" />

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
