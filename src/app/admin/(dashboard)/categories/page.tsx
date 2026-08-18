import { db } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "../../actions";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true, children: true } } },
  });

  const tree = buildCategoryTree(categories);
  const rows = flattenCategoryTree(tree);
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Категории</h1>
      </div>

      <form action={createCategoryAction} className="card-box" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input name="name" placeholder="Име на нова категория / подкатегория" required style={{ flex: 1, padding: 9, border: "1px solid var(--line)", borderRadius: 4 }} />
        <select name="parentId" defaultValue="" style={{ padding: 9, border: "1px solid var(--line)", borderRadius: 4, minWidth: 240 }}>
          <option value="">— Основна категория (без родител) —</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>Подкатегория на: {c.name}</option>
          ))}
        </select>
        <button className="btn btn--sm" type="submit">+ Добави</button>
      </form>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr><th>Име</th><th>Slug</th><th>Продукти</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const meta = categories.find((cc) => cc.id === c.id)!;
              return (
                <tr key={c.id}>
                  <td>{c.depth > 0 ? <span className="muted">↳ </span> : null}{c.name}</td>
                  <td className="muted">{c.slug}</td>
                  <td>{meta._count.products}</td>
                  <td>
                    {meta._count.products === 0 && meta._count.children === 0 ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn btn--ghost btn--sm">Изтрий</button>
                      </form>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        {meta._count.children > 0 ? "има подкатегории" : "има продукти"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
