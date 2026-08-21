#!/usr/bin/env node
/**
 * Imports the real TopStyle.bg product catalog (name, price, description,
 * sizes, colors, stock, category) from PrestaShop SQL-manager exports into:
 *   1. The live Neon/Postgres database, via Prisma (immediately, when you run this).
 *   2. scripts/prestashop-import/mysql-import.sql - a ready-to-run MySQL file
 *      for the php-site/ version, to import via phpMyAdmin whenever that DB
 *      is reachable.
 *
 * SETUP - before running, put these 4 files (exported from PrestaShop's
 * Advanced Parameters > Database > SQL Manager, semicolon-delimited CSV)
 * into scripts/prestashop-import/data/, named exactly:
 *
 *   products.csv    id_product;sku;name;price;description;description_short
 *   categories.csv  id_product;id_category;category_name
 *   variants.csv    id_product;id_product_attribute;variant_sku;quantity;attributes
 *   images.csv      id_product;id_image;position;cover
 *
 * RUN:
 *   node scripts/prestashop-import/import.mjs
 *
 * Safe to re-run any time - products are upserted by SKU, and each run
 * replaces that product's variants with the freshest sizes/colors/stock.
 * Use this for a final "sync" run right before the real site launch, to
 * pick up last-minute stock/price changes made on the still-live PrestaShop
 * site in the meantime.
 *
 * NOTE ON PHOTOS: PrestaShop lazy-loads product images via JS, so they
 * can't be read from the SQL export directly. Until the real photos are
 * imported (from a downloaded img/p/ folder), each product gets the same
 * placeholder-swatch image the original catalog used - swap these any time
 * from Admin > Products > Edit > Images, no need to re-run this script.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const OUT_SQL = path.join(__dirname, "mysql-import.sql");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// Plain `node script.mjs` doesn't auto-load .env like Next.js/Prisma CLI do -
// load it ourselves so you don't need to remember a special flag every time
// you re-run this (e.g. for the final pre-launch sync).
function loadEnvFile() {
  const envPath = path.join(PROJECT_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

// Bulgaria's fixed euro-conversion peg (BGN follows EUR exactly at this
// rate) - PrestaShop's stored `price` is in EUR (the shop's live prices are
// shown as "29,99 € / 58.66 лв.", EUR first).
const EUR_TO_BGN = 1.95583;

// PrestaShop id_category -> our Category.slug, gathered from the live
// topstyle.bg nav. isChild marks subcategories: when a product is tagged
// with both a parent and its child category (very common - PrestaShop
// tags products with the whole ancestor chain), we want the more specific
// one as the product's actual category here, since our schema only allows
// one category per product.
const CATEGORY_MAP = {
  10: { slug: "mazhki-teniski", isChild: false },
  11: { slug: "teniski-s-yaka", isChild: true },
  12: { slug: "mzhki-yaketa", isChild: false },
  13: { slug: "proletni", isChild: true },
  14: { slug: "esenno-zimni", isChild: true },
  15: { slug: "myzhki-dynki-i-pantaloni", isChild: false },
  16: { slug: "kysi-dynki", isChild: true },
  17: { slug: "kysi-pantaloni", isChild: true },
  18: { slug: "myzhki-ekipi", isChild: false },
  19: { slug: "ekipi", isChild: true },
  20: { slug: "suicheri", isChild: true },
  21: { slug: "dolnishte", isChild: true },
  22: { slug: "myzhki-bluzi", isChild: false },
  23: { slug: "puloveri", isChild: true },
  24: { slug: "myzhki-rizi", isChild: false },
  38: { slug: "banski", isChild: false },
  39: { slug: "banski", isChild: false },
  40: { slug: "hudi", isChild: true },
  42: { slug: "komplekti", isChild: false },
};

const COLOR_HEX = {
  "черен": "1a1a1a", "бял": "e8e8e8", "син": "2b5fa8", "тъмносин": "17335c",
  "зелен": "2f7d43", "тъмнозелен": "1f4d2c", "сив": "8a8a8a", "кафяв": "6b4a2f",
  "червен": "b3221f", "каки": "8a7a4b", "тъмнобордо": "5a1f2b", "бордо": "6b1f2b",
  "светлобежов": "d8c6a8", "корало червен": "d9564a", "универсален": "9ca3af",
  "мента": "8fd1c0", "небесносин": "6fb6e0",
};
function hexFor(color) {
  return COLOR_HEX[(color || "").toLowerCase()] || "9ca3af";
}
function placeholderImage(label, color) {
  const bg = hexFor(color);
  return `https://placehold.co/600x750/${bg}/ffffff?font=roboto&text=${encodeURIComponent(label || "TopStyle")}`;
}

// --- Minimal CSV parser: semicolon-delimited, RFC4180-style quoting with
// "" escaping and embedded newlines inside quoted fields - exactly what
// PrestaShop's SQL Manager export produces. ---
function parseCsv(text, delimiter = ";") {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function readCsv(filename, { required = true } = {}) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    if (!required) return [];
    throw new Error(
      `Missing ${filePath}\nCopy your PrestaShop SQL Manager export there first - see the comment at the top of this script.`
    );
  }
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text);
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function stripTags(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function extractFirstImgSrc(html) {
  const m = (html || "").match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : "";
}
// Converts the PrestaShop measurement <table> (found inside description_short)
// into the plain CSV format sizeChartTable expects (first row = headers).
function htmlTableToCsv(html) {
  const tableMatch = (html || "").match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return "";
  const trMatches = [...tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const lines = [];
  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]));
    if (cells.length === 0 || cells.every((c) => c === "")) continue;
    lines.push(cells.map((c) => (c.includes(",") ? `"${c.replace(/"/g, '""')}"` : c)).join(","));
  }
  return lines.join("\n");
}

// "Размер: XL | Цвят: бял" -> { size: "XL", color: "бял" }
function parseAttributes(attrString) {
  let size = "";
  let color = "";
  for (const part of (attrString || "").split("|").map((s) => s.trim())) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (key.startsWith("разм")) size = value;
    else if (key.startsWith("цвят")) color = value;
  }
  return { size, color };
}

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "", ю: "yu", я: "ya",
};
function slugify(name) {
  return name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${randomUUID().slice(0, 8)}`;
}

function sqlStr(v) {
  return `'${String(v ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}
function mysqlId() {
  return randomUUID().replace(/-/g, "");
}

async function main() {
  console.log("Reading CSVs...");
  const products = readCsv("products.csv");
  const categoryLinks = readCsv("categories.csv");
  const variantRows = readCsv("variants.csv");
  // images.csv is optional for now - not used yet (see NOTE ON PHOTOS above),
  // read here only so it's picked up automatically once real photo handling
  // is added later.
  readCsv("images.csv", { required: false });

  console.log(`${products.length} products, ${categoryLinks.length} category links, ${variantRows.length} variant rows`);

  const categoryByProduct = new Map();
  for (const row of categoryLinks) {
    const mapped = CATEGORY_MAP[Number(row.id_category)];
    if (!mapped) continue;
    const existing = categoryByProduct.get(row.id_product);
    if (!existing || (mapped.isChild && !existing.isChild)) {
      categoryByProduct.set(row.id_product, mapped);
    }
  }

  const variantsByProduct = new Map();
  for (const row of variantRows) {
    const { size, color } = parseAttributes(row.attributes);
    if (!size) continue;
    const list = variantsByProduct.get(row.id_product) || [];
    list.push({ size, color, stock: parseInt(row.quantity, 10) || 0 });
    variantsByProduct.set(row.id_product, list);
  }

  const dbCategories = await prisma.category.findMany();
  const categoryIdBySlug = Object.fromEntries(dbCategories.map((c) => [c.slug, c.id]));
  const categoryNameBySlug = Object.fromEntries(dbCategories.map((c) => [c.slug, c.name]));

  const sql = [];
  sql.push("-- Generated by scripts/prestashop-import/import.mjs - safe to re-run.");
  sql.push("SET NAMES utf8mb4;");
  sql.push("");

  let imported = 0;
  let importedActive = 0;
  let skippedNoCategory = 0;
  let skippedNoName = 0;
  const usedSlugs = new Set();
  const unmappedCategoryIds = new Set();

  for (const row of categoryLinks) {
    if (!CATEGORY_MAP[Number(row.id_category)]) unmappedCategoryIds.add(row.id_category);
  }

  for (const p of products) {
    const idProduct = p.id_product;
    const name = (p.name || "").trim();
    if (!name) {
      skippedNoName++;
      continue;
    }

    const catInfo = categoryByProduct.get(idProduct);
    if (!catInfo || !categoryIdBySlug[catInfo.slug]) {
      skippedNoCategory++;
      continue;
    }
    const categoryId = categoryIdBySlug[catInfo.slug];
    const categorySlug = catInfo.slug;
    const categoryName = categoryNameBySlug[catInfo.slug];

    const sku = (p.sku || "").trim() || `PS-${idProduct}`;

    let baseSlug = slugify(name);
    let uniqueSlug = baseSlug;
    let n = 2;
    while (usedSlugs.has(uniqueSlug)) uniqueSlug = `${baseSlug}-${n++}`;
    usedSlugs.add(uniqueSlug);

    const priceEur = parseFloat(p.price) || 0;
    const priceBgn = Math.round(priceEur * EUR_TO_BGN * 100) / 100;

    // Whether the product is actually live on the old site right now -
    // ps_product_shop.active is the field PrestaShop's own admin/storefront
    // go by (not the older ps_product.active, which can be stale), so a
    // product only ends up active here if it's genuinely active there too.
    const active = p.active === undefined ? true : p.active === "1" || p.active === 1 || p.active === true;

    const description = stripTags(p.description) || name;
    const sizeChartUrl = extractFirstImgSrc(p.description_short);
    const sizeChartTable = htmlTableToCsv(p.description_short);

    const variants = variantsByProduct.get(idProduct) || [];
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
    const primaryColor = colors[0] || "";

    // --- Live Postgres write (Next.js side) ---
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        description,
        priceEur,
        priceBgn,
        categoryId,
        color: primaryColor,
        sizeChartUrl,
        sizeChartTable,
        active,
      },
      create: {
        sku,
        name,
        slug: uniqueSlug,
        description,
        priceEur,
        priceBgn,
        categoryId,
        color: primaryColor,
        sizeChartUrl,
        sizeChartTable,
        active,
      },
    });

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map((v) => ({ productId: product.id, size: v.size, color: v.color, stock: v.stock })),
      });
    }

    const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      await prisma.productImage.create({
        data: { productId: product.id, url: placeholderImage(categoryName, primaryColor), position: 0 },
      });
    }

    // --- MySQL equivalent (php-site side) ---
    const newProductId = mysqlId();
    sql.push(
      `INSERT INTO product (id, sku, name, slug, description, color, price_eur, price_bgn, category_id, size_chart_url, size_chart_table, active) VALUES ` +
        `(${sqlStr(newProductId)}, ${sqlStr(sku)}, ${sqlStr(name)}, ${sqlStr(uniqueSlug)}, ${sqlStr(description)}, ${sqlStr(primaryColor)}, ${priceEur}, ${priceBgn}, ` +
        `(SELECT id FROM category WHERE slug = ${sqlStr(categorySlug)}), ${sqlStr(sizeChartUrl)}, ${sqlStr(sizeChartTable)}, ${active ? 1 : 0}) ` +
        `ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), color=VALUES(color), price_eur=VALUES(price_eur), price_bgn=VALUES(price_bgn), category_id=VALUES(category_id), size_chart_url=VALUES(size_chart_url), size_chart_table=VALUES(size_chart_table), active=VALUES(active);`
    );
    sql.push(
      `DELETE FROM product_variant WHERE product_id = (SELECT id FROM product WHERE sku = ${sqlStr(sku)});`
    );
    if (variants.length > 0) {
      const values = variants
        .map(
          (v) =>
            `(${sqlStr(mysqlId())}, (SELECT id FROM product WHERE sku = ${sqlStr(sku)}), ${sqlStr(v.size)}, ${sqlStr(v.color)}, ${v.stock})`
        )
        .join(",\n  ");
      sql.push(`INSERT INTO product_variant (id, product_id, size, color, stock) VALUES\n  ${values};`);
    }
    sql.push(
      `INSERT INTO product_image (id, product_id, url, position) ` +
        `SELECT ${sqlStr(mysqlId())}, id, ${sqlStr(placeholderImage(categoryName, primaryColor))}, 0 FROM product WHERE sku = ${sqlStr(sku)} ` +
        `AND NOT EXISTS (SELECT 1 FROM product_image WHERE product_id = (SELECT id FROM product WHERE sku = ${sqlStr(sku)}));`
    );
    sql.push("");

    imported++;
    if (active) importedActive++;
    if (imported % 50 === 0) console.log(`  ...${imported} products imported so far`);
  }

  fs.writeFileSync(OUT_SQL, sql.join("\n"), "utf8");

  console.log("");
  console.log(`Done. Imported ${imported} products into the live Next.js database (${importedActive} active, ${imported - importedActive} inactive).`);
  console.log(`MySQL import file written to: ${OUT_SQL}`);
  if (skippedNoCategory > 0) {
    console.log(`Skipped ${skippedNoCategory} products with no recognized category.`);
  }
  if (skippedNoName > 0) {
    console.log(`Skipped ${skippedNoName} products with a blank name.`);
  }
  if (unmappedCategoryIds.size > 0) {
    console.log(`Unmapped PrestaShop category IDs seen in categories.csv (add to CATEGORY_MAP if these matter): ${[...unmappedCategoryIds].join(", ")}`);
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
