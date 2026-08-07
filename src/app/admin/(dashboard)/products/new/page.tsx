import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../../actions";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";

export default async function NewProductPage() {
  const [categories, products, variants] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" } }),
    db.product.findMany({ select: { material: true, color: true } }),
    db.productVariant.findMany({ select: { color: true } }),
  ]);
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));
  const materialOptions = [...new Set(products.map((p) => p.material).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg"));
  const colorOptions = [...new Set([...products.map((p) => p.color), ...variants.map((v) => v.color)].filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg"));

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Нов продукт</h1>
      </div>
      <ProductForm action={createProductAction} categories={categoryOptions} materialOptions={materialOptions} colorOptions={colorOptions} />
    </>
  );
}
