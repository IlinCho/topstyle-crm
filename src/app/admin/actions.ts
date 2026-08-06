"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, clearSession, verifyAdminCredentials, requireAdminSession } from "@/lib/auth";
import { slugifyBasic } from "@/lib/format";
import { serializeBadges } from "@/lib/badges";
import { clientIp, isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const ip = clientIp();
  const emailKey = `admin:email:${email}`;
  const ipKey = `admin:ip:${ip}`;

  // Checking both email and IP means an attacker can't dodge the limit by
  // either rotating IPs against one known admin email, or spraying many
  // guessed emails from a single machine.
  if ((await isRateLimited(emailKey)) || (await isRateLimited(ipKey))) {
    redirect("/admin/login?error=locked");
  }

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    await recordFailedAttempt(emailKey);
    await recordFailedAttempt(ipKey);
    redirect("/admin/login?error=1");
  }
  await clearAttempts(emailKey);
  await clearAttempts(ipKey);
  await createSession(admin.id, admin.email);
  redirect("/admin");
}

export async function logoutAction() {
  clearSession();
  redirect("/admin/login");
}

// ---------- Categories ----------
export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();
  const name = String(formData.get("name") || "").trim();
  const parentId = String(formData.get("parentId") || "").trim() || null;
  if (!name) return;
  const slug = slugifyBasic(name);
  const count = await db.category.count();
  await db.category.create({ data: { name, slug, position: count, parentId } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategoryImageAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  if (!id) return;
  await db.category.update({ where: { id }, data: { imageUrl } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const productsInCategory = await db.product.count({ where: { categoryId: id } });
  if (productsInCategory > 0) return; // guard: don't orphan products
  const subcategories = await db.category.count({ where: { parentId: id } });
  if (subcategories > 0) return; // guard: don't orphan subcategories
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

// Empty input -> no pin (falls back to newest-first). Anything else is
// clamped to a sane 1-8 range so a typo can't push a product to rank -50.
function parseCategoryRank(formData: FormData): number | null {
  const raw = String(formData.get("categoryRank") || "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(8, Math.max(1, n));
}

export async function createProductAction(formData: FormData) {
  await requireAdminSession();
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const priceEur = parseFloat(String(formData.get("priceEur") || "0"));
  const priceBgn = parseFloat(String(formData.get("priceBgn") || "0"));
  const material = String(formData.get("material") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrls = (formData.getAll("imageUrl") as string[])
    .map((u) => u.trim())
    .filter(Boolean);
  const sku = String(formData.get("sku") || "").trim() || `SKU-${Date.now()}`;
  const badges = serializeBadges(formData.getAll("badge") as string[]);
  const categoryRank = parseCategoryRank(formData);

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
      badges,
      categoryRank,
      variants: { create: variants },
      images: imageUrls.length
        ? { create: imageUrls.map((url, position) => ({ url, position })) }
        : undefined,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}/edit?created=1`);
}

export async function updateProductAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const priceEur = parseFloat(String(formData.get("priceEur") || "0"));
  const priceBgn = parseFloat(String(formData.get("priceBgn") || "0"));
  const material = String(formData.get("material") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrls = (formData.getAll("imageUrl") as string[])
    .map((u) => u.trim())
    .filter(Boolean);
  const active = formData.get("active") === "on";
  const badges = serializeBadges(formData.getAll("badge") as string[]);
  const categoryRank = parseCategoryRank(formData);

  if (!id || !name || !categoryId) return;

  const variants = parseVariantsFromForm(formData);

  await db.product.update({
    where: { id },
    data: { name, categoryId, priceEur, priceBgn, material, color, description, active, badges, categoryRank },
  });

  await db.productVariant.deleteMany({ where: { productId: id } });
  if (variants.length) {
    await db.productVariant.createMany({ data: variants.map((v) => ({ ...v, productId: id })) });
  }

  // Images are rebuilt from scratch on every save (same pattern as variants
  // above) - simplest way to support an arbitrary number of photos, add/remove
  // included, without needing to track individual row ids from the form.
  await db.productImage.deleteMany({ where: { productId: id } });
  if (imageUrls.length) {
    await db.productImage.createMany({
      data: imageUrls.map((url, position) => ({ productId: id, url, position })),
    });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/");
  redirect(`/admin/products/${id}/edit?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ---------- Orders ----------
export async function updateOrderStatusAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "pending");
  await db.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

// ---------- Reviews ----------
export async function createReviewAction(formData: FormData) {
  await requireAdminSession();
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
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const productId = String(formData.get("productId") || "");
  if (!id) return;
  await db.review.delete({ where: { id } });
  revalidatePath(`/admin/products/${productId}/edit`);
}

// ---------- Stock alerts ("Уведоми ме при наличност") ----------
export async function markStockAlertNotifiedAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.stockAlert.update({ where: { id }, data: { notified: true } });
  revalidatePath("/admin/stock-alerts");
}

export async function deleteStockAlertAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.stockAlert.delete({ where: { id } });
  revalidatePath("/admin/stock-alerts");
}
