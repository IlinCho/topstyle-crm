import Link from "next/link";
import { formatBgn, formatEur } from "@/lib/format";

type CardProduct = {
  slug: string;
  name: string;
  priceEur: number;
  priceBgn: number;
  images: { url: string }[];
  variants: { stock: number }[];
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const img = product.images[0]?.url || "https://placehold.co/600x750/eeeeee/999999?text=TopStyle";

  return (
    <Link href={`/product/${product.slug}`} className="card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={product.name} className="card__img" loading="lazy" />
      <div className="card__body">
        {totalStock === 0 && <span className="badge badge--out">Изчерпан</span>}
        {totalStock > 0 && totalStock <= 5 && <span className="badge badge--low">Последни бройки</span>}
        <p className="card__name">{product.name}</p>
        <div className="card__price">
          {formatEur(product.priceEur)} <small>{formatBgn(product.priceBgn)}</small>
        </div>
      </div>
    </Link>
  );
}
