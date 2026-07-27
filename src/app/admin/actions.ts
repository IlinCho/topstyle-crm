"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, clearSession, verifyAdminCredentials } from "@/lib/auth";
import { slugifyBasic } from "@/lib/format";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    redirect("/admin/login?error=1");
  }
  await createSession(admin.id, admin.email);
  redirect("/admin");
}

export async function logoutAction() {
  clearSession();
  redirect("/admin/login");
}

// ---------- Categories ----------
export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const slug = slugifyBasic(name);
  const count = await db.category.count();
  await db.category.create({ data: { name, slug, position: count } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const productsInCategory = await db.product.count({ where: { categoryId: id } });
  if (productsInCategory > 0) return; // guard: don't orphan products
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

// ---------- Products ----------
function parseVariantsFromForm(formData: FormData) {
  const sizes = formData.getAll("variant_size") as string[];
  const colors = formData.getAll("variant_color") as string[];
  const stocks = formData.getAll("variant_stock") as string[];
  const variants = [];
  for (let i = 0; i < sizes.length; i++) {
    if (!sizes[i]?.trim()) continue;
    variants.push({
      size: sizes[i].trim(),
      color: (colors[i] || "").trim(),
      stock: parseInt(stocks[i] || "0", 10) || 0,
    });
  }
  return variants;
}

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const priceEur = parseFloat(String(formData.get("priceEur") || "0"));
  const priceBgn = parseFloat(String(formData.get("priceBgn") || "0"));
  const material = String(formData.get("material") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const sku = String(formData.get("sku") || "").trim() || `SKU-${Date.now()}`;
  const featured = formData.get("featured") === "on";

  if (!name || !categoryId) return;

  const slug = `${slugifyBasic(name)}-${Date.now().toString().slice(-5)}`;
  const variants = parseVariantsFromForm(formData);

  const product = await db.product.create({
    data: {
      sku,
      name,
      slug,
      description,
      material,
      color,
      priceEur,
      priceBgn,
      categoryId,
      featured,
      variants: { create: variants },
      images: imageUrl ? { create: [{ url: imageUrl, position: 0 }] } : undefined,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}/edit?created=1`);
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const priceEur = parseFloat(String(formData.get("priceEur") || "0"));
  const priceBgn = parseFloat(String(formData.get("priceBgn") || "0"));
  const material = String(formData.get("material") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  if (!id || !name || !categoryId) return;

  const variants = parseVariantsFromForm(formData);

  await db.product.update({
    where: { id },
    data: { name, categoryId, priceEur, priceBgn, material, color, description, active, featured },
  });

  await db.productVariant.deleteMany({ where: { productId: id } });
  if (variants.length) {
    await db.productVariant.createMany({ data: variants.map((v) => ({ ...v, productId: id })) });
  }

  if (imageUrl) {
    const firstImage = await db.productImage.findFirst({ where: { productId: id }, orderBy: { position: "asc" } });
    if (firstImage) {
      await db.productImage.update({ where: { id: firstImage.id }, data: { url: imageUrl } });
    } else {
      await db.productImage.create({ data: { productId: id, url: imageUrl, position: 0 } });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/");
  redirect(`/admin/products/${id}/edit?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ---------- Orders ----------
export async function updateOrderStatusAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "pending");
  await db.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

// ---------- Reviews ----------
export async function createReviewAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const authorName = String(formData.get("authorName") || "").trim();
  const rating = Math.min(5, Math.max(1, parseInt(String(formData.get("rating") || "5"), 10) || 5));
  const comment = String(formData.get("comment") || "").trim();

  if (!productId || !authorName) return;

  await db.review.create({ data: { productId, authorName, rating, comment } });
  // Storefront pages all use `export const dynamic = "force-dynamic"`, so they
  // already re-query the database on every request - no cache to invalidate there.
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteReviewAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const productId = String(formData.get("productId") || "");
  if (!id) return;
  await db.review.delete({ where: { id } });
  revalidatePath(`/admin/products/${productId}/edit`);
}
