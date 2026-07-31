import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { parseBadges } from "@/lib/badges";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";
import {
  updateProductAction,
  deleteProductAction,
  createReviewAction,
  deleteReviewAction,
} from "../../../../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; saved?: string };
}) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: true,
        reviews: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.category.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!product) notFound();
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Редактирай: {product.name}</h1>
        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <button className="btn btn--danger btn--sm" type="submit">Изтрий продукта</button>
        </form>
      </div>

      {searchParams?.created && (
        <div className="card-box" style={{ background: "#e7f6ec", borderColor: "#bfe6cb" }}>
          Продуктът е създаден успешно.
        </div>
      )}
      {searchParams?.saved && (
        <div className="card-box" style={{ background: "#e7f6ec", borderColor: "#bfe6cb" }}>
          Промените са запазени.
        </div>
      )}

      <ProductForm
        key={product.updatedAt.toISOString()}
        action={updateProductAction}
        categories={categoryOptions}
        initial={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          categoryId: product.categoryId,
          priceEur: product.priceEur,
          priceBgn: product.priceBgn,
          material: product.material,
          color: product.color,
          description: product.description,
          images: product.images.map((i) => i.url),
          active: product.active,
          badges: parseBadges(product.badges),
          categoryRank: product.categoryRank,
          variants: product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
        }}
      />

      <div className="card-box">
        <strong>Ревюта на продукта</strong>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Ревютата се показват под снимката на продукта в магазина. Добавяй само реални отзиви от клиенти.
        </p>

        {product.reviews.length > 0 && (
          <table className="admin-table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Автор</th>
                <th>Оценка</th>
                <th>Коментар</th>
                <th>Дата</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {product.reviews.map((r) => (
                <tr key={r.id}>
                  <td>{r.authorName}</td>
                  <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                  <td style={{ maxWidth: 320 }}>{r.comment}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString("bg-BG")}</td>
                  <td>
                    <form action={deleteReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="btn btn--ghost btn--sm">✕</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form action={createReviewAction} style={{ marginTop: 16 }}>
          <input type="hidden" name="productId" value={product.id} />
          <div className="form-grid">
            <div className="field">
              <label>Име на клиента</label>
              <input name="authorName" required />
            </div>
            <div className="field">
              <label>Оценка</label>
              <select name="rating" defaultValue="5">
                <option value="5">5 звезди</option>
                <option value="4">4 звезди</option>
                <option value="3">3 звезди</option>
                <option value="2">2 звезди</option>
                <option value="1">1 звезда</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Коментар (по избор)</label>
            <textarea name="comment" />
          </div>
          <button type="submit" className="btn btn--sm">+ Добави ревю</button>
        </form>
      </div>
    </>
  );
}
