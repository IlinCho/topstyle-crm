import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatBgn, formatEur } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import RatingStars from "@/components/RatingStars";
import { TRUST_CONFIG } from "@/lib/trust-config";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      variants: true,
      category: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
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
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={product.name} className="pdp__img" />
        </div>

        <div>
          <h1 className="pdp__title">{product.name}</h1>

          <div className="pdp__rating-row">
            {product.reviews.length > 0 ? (
              <a href="#otzivi" className="pdp__rating-link">
                <RatingStars reviews={product.reviews} size="md" showOutOf5 />
              </a>
            ) : (
              <RatingStars reviews={product.reviews} size="md" showOutOf5 />
            )}
            {product.reviews.length > 0 && <span className="pdp__rating-sep">|</span>}
            <span className="muted" style={{ fontSize: 13 }}>SKU: {product.sku}</span>
          </div>

          {TRUST_CONFIG.customersServedText && (
            <p className="pdp__trust-line">✓ {TRUST_CONFIG.customersServedText}</p>
          )}

          <div className="pdp__price">
            {formatEur(product.priceEur)} <small>{formatBgn(product.priceBgn)}</small>
          </div>

          <div className="pdp__meta">
            <div>Материя: {product.material || "—"}</div>
            <div>Цвят: {product.color || "—"}</div>
            <div>{totalStock > 0 ? `В наличност (${totalStock} бр.)` : "Изчерпан"}</div>
          </div>

          {totalStock > 0 && totalStock <= 5 && (
            <p className="urgency-line">Последни {totalStock} бр. в наличност</p>
          )}
          {TRUST_CONFIG.sameDayCutoffTime && (
            <p className="urgency-line">
              Поръчай до {TRUST_CONFIG.sameDayCutoffTime} ч. — изпращаме още днес
            </p>
          )}

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

      {product.reviews.length > 0 && (
        <div className="reviews-section" id="otzivi">
          <h2 className="section-title" style={{ marginTop: 0 }}>Отзиви от клиенти</h2>
          <RatingStars reviews={product.reviews} size="md" />
          <div className="review-list">
            {product.reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-item__top">
                  <strong>{r.authorName}</strong>
                  <RatingStars reviews={[{ rating: r.rating }]} size="sm" showCount={false} />
                </div>
                {r.comment && <p className="review-item__comment">{r.comment}</p>}
                <p className="review-item__date">{new Date(r.createdAt).toLocaleDateString("bg-BG")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
