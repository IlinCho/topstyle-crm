import { db } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Категории</h1>
      </div>

      <form action={createCategoryAction} className="card-box" style={{ display: "flex", gap: 12 }}>
        <input name="name" placeholder="Име на нова категория" required style={{ flex: 1, padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }} />
        <button className="btn btn--sm" type="submit">+ Добави</button>
      </form>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr><th>Име</th><th>Slug</th><th>Продукти</th><th></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="muted">{c.slug}</td>
                <td>{c._count.products}</td>
                <td>
                  {c._count.products === 0 ? (
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn--ghost btn--sm">Изтрий</button>
                    </form>
                  ) : (
                    <span className="muted" style={{ fontSize: 12 }}>има продукти</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
