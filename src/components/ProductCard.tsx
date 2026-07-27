import Link from "next/link";
import { formatBgn, formatEur } from "@/lib/format";
import RatingStars from "./RatingStars";
import { BADGE_DEFS, parseBadges } from "@/lib/badges";

type CardProduct = {
  slug: string;
  name: string;
  priceEur: number;
  priceBgn: number;
  images: { url: string }[];
  variants: { size: string; stock: number }[];
  badges?: string;
  reviews?: { rating: number }[];
};

// Standard size ordering so chips always line up left-to-right in a sensible order,
// regardless of the order variants happen to come back from the database.
const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "XXXL"];

export default function ProductCard({ product }: { product: CardProduct }) {
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const img = product.images[0]?.url || "https://placehold.co/600x750/eeeeee/999999?text=TopStyle";
  const activeBadges = parseBadges(product.badges);

  // Sum stock per size (a product can have the same size across multiple colors -
  // the card doesn't let you pick color, so we care whether ANY of that size is left).
  const stockBySize = new Map<string, number>();
  for (const v of product.variants) {
    stockBySize.set(v.size, (stockBySize.get(v.size) || 0) + v.stock);
  }
  const sizes = [...stockBySize.keys()].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, undefined, { numeric: true });
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <Link href={`/product/${product.slug}`} className="card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={product.name} className="card__img" loading="lazy" />
      <div className="card__body">
        <RatingStars reviews={product.reviews || []} size="sm" />
        <div className="card__badges">
          {BADGE_DEFS.filter((b) => activeBadges.includes(b.key)).map((b) => (
            <span key={b.key} className={`badge ${b.className}`}>{b.label}</span>
          ))}
          {totalStock === 0 && <span className="badge badge--out">Изчерпан</span>}
          {totalStock > 0 && totalStock <= 5 && <span className="badge badge--low">Последни бройки</span>}
        </div>
        <p className="card__name">{product.name}</p>
        <div className="card__price">
          {formatEur(product.priceEur)} <small>{formatBgn(product.priceBgn)}</small>
        </div>
        {sizes.length > 0 && (
          <div className="card__sizes">
            {sizes.map((s) => (
              <span key={s} className={`size-chip ${stockBySize.get(s) === 0 ? "size-chip--out" : ""}`}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
