import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatBgn, formatEur } from "@/lib/format";
import AddToCart from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: { images: true, variants: true, category: true },
  });
  if (!product) notFound();

  const img = product.images[0]?.url || "https://placehold.co/600x750/eeeeee/999999?text=TopStyle";
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="container">
      <p style={{ margin: "18px 0", fontSize: 13 }}>
        <Link href="/" className="muted">Начало</Link> /{" "}
        <Link href={`/category/${product.category.slug}`} className="muted">{product.category.name}</Link>
      </p>

      <div className="pdp">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={product.name} className="pdp__img" />

        <div>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__price">
            {formatEur(product.priceEur)} <small>{formatBgn(product.priceBgn)}</small>
          </div>

          <div className="pdp__meta">
            <div>Материя: {product.material || "—"}</div>
            <div>Цвят: {product.color || "—"}</div>
            <div>Артикул: {product.sku}</div>
            <div>{totalStock > 0 ? `В наличност (${totalStock} бр.)` : "Изчерпан"}</div>
          </div>

          <p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 8 }}>{product.description}</p>

          <AddToCart
            productId={product.id}
            slug={product.slug}
            name={product.name}
            image={img}
            priceBgn={product.priceBgn}
            priceEur={product.priceEur}
            variants={product.variants}
          />
        </div>
      </div>
    </div>
  );
}
