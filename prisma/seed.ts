/**
 * Seeds the database from the TopStyle.bg scrape (products.json / categories.json,
 * produced by build_catalog.py from the live category listing pages).
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import categories from "./categories.json";
import products from "./products.json";

const prisma = new PrismaClient();

// Deterministic color -> hex swatch used to generate a placeholder product photo
// (the live site lazy-loads its real images via JS, so plain-HTML scraping could not
// capture real photo URLs - see README "Known limitations". Swap these for real
// photos any time from Admin > Products > Edit > Images).
const COLOR_HEX: Record<string, string> = {
  "черен": "1a1a1a", "бял": "e8e8e8", "син": "2b5fa8", "тъмносин": "17335c",
  "зелен": "2f7d43", "тъмнозелен": "1f4d2c", "сив": "8a8a8a", "кафяв": "6b4a2f",
  "червен": "b3221f", "каки": "8a7a4b", "тъмнобордо": "5a1f2b",
  "светлобежов": "d8c6a8", "корало червен": "d9564a", "универсален": "9ca3af",
};

function hexFor(color: string) {
  return COLOR_HEX[color] || "9ca3af";
}

function placeholderImage(categoryName: string, color: string) {
  const bg = hexFor(color);
  const label = encodeURIComponent(categoryName);
  return `https://placehold.co/600x750/${bg}/ffffff?font=roboto&text=${label}`;
}

async function main() {
  console.log("Seeding categories...");
  const categoryIdBySlug: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, position: i },
      create: { slug: c.slug, name: c.name, position: i },
    });
    categoryIdBySlug[c.slug] = created.id;
  }

  console.log(`Seeding ${products.length} products...`);
  let count = 0;
  for (const p of products as any[]) {
    const categoryId = categoryIdBySlug[p.categorySlug];
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        slug: p.slug,
        material: p.material,
        color: p.color,
        priceEur: p.priceEur,
        priceBgn: p.priceBgn,
        sourceUrl: p.sourceUrl,
        categoryId,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: `${p.name}. Материя: ${p.material}. Внесен модел, наличен в няколко размера.`,
        material: p.material,
        color: p.color,
        priceEur: p.priceEur,
        priceBgn: p.priceBgn,
        sourceUrl: p.sourceUrl,
        categoryId,
      },
    });

    // Replace variants + images idempotently
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.createMany({
      data: p.variants.map((v: any) => ({
        productId: product.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    });

    const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: placeholderImage(p.categoryName, p.color),
          position: 0,
        },
      });
    }

    count++;
  }
  console.log(`Seeded ${count} products.`);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@topstyle.bg";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-now";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: { email: adminEmail, passwordHash, name: "Admin", role: "admin" },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
