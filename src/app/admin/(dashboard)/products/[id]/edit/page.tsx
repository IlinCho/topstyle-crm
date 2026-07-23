import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { updateProductAction, deleteProductAction } from "../../../../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: { images: true, variants: true },
    }),
    db.category.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!product) notFound();

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

      <ProductForm
        action={updateProductAction}
        categories={categories}
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
          imageUrl: product.images[0]?.url,
          active: product.active,
          variants: product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
        }}
      />
    </>
  );
}
