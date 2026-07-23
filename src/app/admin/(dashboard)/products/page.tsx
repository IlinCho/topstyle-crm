import Link from "next/link";
import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });

  const products = await db.product.findMany({
    where: {
      ...(searchParams.q ? { name: { contains: searchParams.q } } : {}),
      ...(searchParams.category ? { categoryId: searchParams.category } : {}),
    },
    include: { images: true, variants: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Продукти ({products.length})</h1>
        <Link href="/admin/products/new" className="btn btn--sm">+ Нов продукт</Link>
      </div>

      <form className="card-box" style={{ display: "flex", gap: 12 }}>
        <input name="q" placeholder="Търси по име..." defaultValue={searchParams.q} style={{ flex: 1, padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }} />
        <select name="category" defaultValue={searchParams.category || ""} style={{ padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }}>
          <option value="">Всички категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn btn--sm" type="submit">Филтрирай</button>
      </form>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th><th>Име</th><th>Категория</th><th>Цена</th><th>Наличност</th><th>Статус</th><th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]?.url} alt={p.name} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{p.sku}</div>
                  </td>
                  <td>{p.category.name}</td>
                  <td>{formatBgn(p.priceBgn)}</td>
                  <td>{stock}</td>
                  <td>
                    <span className={`pill ${p.active ? "pill--ok" : "pill--warn"}`}>
                      {p.active ? "активен" : "скрит"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}/edit`} className="btn btn--ghost btn--sm">
                      Редактирай
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={7} className="muted">Няма намерени продукти.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
