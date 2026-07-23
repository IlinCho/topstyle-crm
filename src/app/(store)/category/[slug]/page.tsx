import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const [allCategories, products] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" } }),
    db.product.findMany({
      where: { categoryId: category.id, active: true },
      include: { images: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="container">
      <div className="chip-row" style={{ marginTop: 24 }}>
        {allCategories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className={`chip ${c.slug === category.slug ? "active" : ""}`}>
            {c.name}
          </Link>
        ))}
      </div>

      <h1 className="section-title" style={{ marginTop: 0 }}>
        {category.name} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>({products.length} продукта)</span>
      </h1>

      {products.length === 0 ? (
        <p className="muted">Все още няма продукти в тази категория.</p>
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
