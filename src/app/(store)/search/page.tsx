import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();

  const products = q
    ? await db.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { images: true, variants: true, reviews: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 24 }}>
        {q ? `Резултати за "${q}"` : "Търсене"}{" "}
        <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>
          ({products.length} продукта)
        </span>
      </h1>

      {!q ? (
        <p className="muted">Въведете дума за търсене.</p>
      ) : products.length === 0 ? (
        <p className="muted">Няма намерени продукти.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
