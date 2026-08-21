import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../../actions";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));

  // Suggest the next sequential article number: highest purely-numeric SKU
  // in the catalog (the PrestaShop reference numbers imported earlier, e.g.
  // "1", "2", "3"...) plus one. Non-numeric SKUs (like the "SKU-<timestamp>"
  // or "PS-<id>" fallbacks) are ignored so they can't skew the sequence.
  const skuRows = await db.product.findMany({ select: { sku: true } });
  const maxNumericSku = skuRows.reduce((max, r) => {
    if (!/^\d+$/.test(r.sku)) return max;
    const n = parseInt(r.sku, 10);
    return n > max ? n : max;
  }, 0);
  const nextSku = String(maxNumericSku + 1);

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Нов продукт</h1>
      </div>
      <ProductForm action={createProductAction} categories={categoryOptions} initial={{ sku: nextSku }} />
    </>
  );
}
