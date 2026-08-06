import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();

  const products = q
    ? await db.product.findMany({
        where: { active: true, name: { contains: q, mode: "insensitive" } },
        include: { images: true, variants: true, reviews: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 20 }}>
        {q ? `Резултати за „${q}“` : "Търсене"}
      </h1>

      {!q && <p className="muted">Въведи име на продукт в полето за търсене.</p>}
      {q && products.length === 0 && <p className="muted">Няма намерени продукти.</p>}

      {products.length > 0 && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
