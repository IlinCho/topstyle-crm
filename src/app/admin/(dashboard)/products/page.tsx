import Link from "next/link";
import { db } from "@/lib/db";
import { formatEur } from "@/lib/format";

export const dynamic = "force-dynamic";

// There are 1200+ products in the catalog - a hardcoded take:200 with no
// pagination meant everything past the first 200 (by newest-created) was
// simply unreachable from this page, no matter what you searched for. Real
// pagination fixes that. Search also used to only match the product NAME,
// which is useless for finding a specific product by its code (SKU) - now
// matches either.
const PAGE_SIZE = 100;

function buildHref(base: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return `/admin/products${qs ? `?${qs}` : ""}`;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const q = (searchParams.q || "").trim();
  const category = searchParams.category || "";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const categories = await db.category.findMany({ orderBy: { position: "asc" } });

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { categoryId: category } : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { images: true, variants: true, category: true },
      // Newest-added first, same rule whether or not a category filter is
      // applied (the `where` clause narrows the set, this `orderBy` controls
      // the order within it either way). Products imported in one migration
      // batch (createMany) can share the exact same createdAt timestamp down
      // to the microsecond - id (a cuid, which starts with a timestamp
      // component) as a tie-breaker keeps the order deterministic and still
      // "most recent first" even among same-timestamp rows, instead of
      // silently falling back to whatever order Postgres happens to return.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Продукти ({total})</h1>
        <Link href="/admin/products/new" className="btn btn--sm">+ Нов продукт</Link>
      </div>

      <form className="card-box" style={{ display: "flex", gap: 12 }}>
        <input name="q" placeholder="Търси по име или код (SKU)..." defaultValue={q} style={{ flex: 1, padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }} />
        <select name="category" defaultValue={category} style={{ padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }}>
          <option value="">Всички категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn btn--sm" type="submit">Филтрирай</button>
        {(q || category) && (
          <Link href="/admin/products" className="btn btn--ghost btn--sm">Изчисти</Link>
        )}
      </form>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th><th>SKU</th><th>Име</th><th>Категория</th><th>Позиция</th><th>Цена</th><th>Наличност</th><th>Статус</th><th></th>
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
                  <td className="muted">{p.sku}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                  </td>
                  <td>{p.category.name}</td>
                  <td>{p.categoryRank ? <span className="pill pill--ok">#{p.categoryRank}</span> : <span className="muted">—</span>}</td>
                  <td>{formatEur(p.priceEur)}</td>
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
              <tr><td colSpan={9} className="muted">Няма намерени продукти.</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <Link
              href={buildHref({ q, category, page: String(Math.max(1, page - 1)) })}
              className="btn btn--ghost btn--sm"
              style={page <= 1 ? { pointerEvents: "none", opacity: 0.4 } : undefined}
            >
              ← Предишна
            </Link>
            <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>
              Страница {page} от {totalPages}
            </span>
            <Link
              href={buildHref({ q, category, page: String(Math.min(totalPages, page + 1)) })}
              className="btn btn--ghost btn--sm"
              style={page >= totalPages ? { pointerEvents: "none", opacity: 0.4 } : undefined}
            >
              Следваща →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
