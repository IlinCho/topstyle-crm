import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../../actions";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Нов продукт</h1>
      </div>
      <ProductForm action={createProductAction} categories={categoryOptions} />
    </>
  );
}
