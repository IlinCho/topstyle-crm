import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../../actions";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Нов продукт</h1>
      </div>
      <ProductForm action={createProductAction} categories={categories} />
    </>
  );
}
