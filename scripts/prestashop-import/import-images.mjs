#!/usr/bin/env node
/**
 * Imports the REAL product photos from PrestaShop into:
 *   1. The live Neon/Postgres database (Next.js side) - uploads each photo
 *      to Vercel Blob and replaces the placeholder ProductImage rows.
 *   2. php-site/uploads/products/ (PHP side) - copies the same files to
 *      local disk and writes scripts/prestashop-import/mysql-images.sql,
 *      ready to run against php-site's MySQL DB whenever that's live.
 *
 * SETUP - before running:
 *   1. scripts/prestashop-import/Data/images.csv must exist, exported from
 *      PrestaShop's SQL Manager with:
 *        SELECT id_image, id_product, position, cover
 *        FROM ps_image ORDER BY id_product, position;
 *   2. scripts/prestashop-import/Data/p/ must contain the real image files,
 *      unzipped from cPanel's img/p/ folder, keeping the original digit-
 *      folder structure (e.g. Data/p/3/3/8/7/3387.jpg).
 *   3. .env must have BLOB_READ_WRITE_TOKEN set (Vercel dashboard -> your
 *      project -> Storage -> the Blob store -> ".env.local" tab -> copy the
 *      BLOB_READ_WRITE_TOKEN line into the project's .env file).
 *
 * RUN:
 *   node scripts/prestashop-import/import-images.mjs
 *
 * Safe to re-run - for each product with at least one real photo found on
 * disk, it deletes that product's current ProductImage rows (whatever they
 * were, placeholder or real) and recreates them fresh. Products with no
 * matching photo file on disk are left untouched (they keep their current
 * placeholder).
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "Data");
const IMG_DIR = path.join(DATA_DIR, "p");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const PHP_UPLOAD_DIR = path.join(PROJECT_ROOT, "php-site", "uploads", "products");
const OUT_SQL = path.join(__dirname, "mysql-images.sql");

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
    // Force-set from .env even if the shell already has a (possibly stale,
    // e.g. from an earlier `vercel env pull` or a leftover shell export)
    // value for this key - the .env file in the project is the source of
    // truth for these scripts.
    process.env[key] = value;
  }
}
loadEnvFile();

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "Missing BLOB_READ_WRITE_TOKEN in .env.\n\n" +
      "Get it from: Vercel dashboard -> your project -> Storage tab -> the\n" +
      "Blob store -> \".env.local\" tab -> copy the BLOB_READ_WRITE_TOKEN=... line\n" +
      "into this project's .env file, then run this script again."
  );
  process.exit(1);
}
console.log(
  `Using Blob token: ${process.env.BLOB_READ_WRITE_TOKEN.slice(0, 20)}...` +
    `${process.env.BLOB_READ_WRITE_TOKEN.slice(-6)} (length ${process.env.BLOB_READ_WRITE_TOKEN.length})`
);

const { PrismaClient } = await import("@prisma/client");
const { put } = await import("@vercel/blob");
const prisma = new PrismaClient();

// --- Same minimal CSV parser as import.mjs (semicolon-delimited, RFC4180 quoting) ---
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}`);
  }
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text);
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}
function mysqlId() {
  return randomUUID().replace(/-/g, "");
}

async function withRetry(fn, { attempts = 5, baseDelayMs = 1500 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient =
        err?.code === "P1017" ||
        err?.code === "P1001" ||
        err?.code === "P1002" ||
        err?.code === "P2024" || // connection pool timeout - happens when the
        // blob uploads between DB calls slow the loop down enough that
        // pooled connections pile up; just wait and retry.
        /closed the connection|connection.*(reset|terminated|lost)|timed out fetching a new connection/i.test(
          String(err?.message || "")
        );
      if (!transient || i === attempts - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, i);
      console.warn(`  (connection hiccup, retrying in ${delay}ms - attempt ${i + 2}/${attempts})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// PrestaShop stores each image at img/p/<digit>/<digit>/.../<id>.jpg - one
// folder per digit of the image id, in order (e.g. id 3387 -> p/3/3/8/7/3387.jpg,
// id 73 -> p/7/3/73.jpg).
function findImageFile(idImage) {
  const digits = String(idImage).split("");
  const filePath = path.join(IMG_DIR, ...digits, `${idImage}.jpg`);
  return fs.existsSync(filePath) ? filePath : null;
}

async function main() {
  console.log("Reading products.csv and images.csv...");
  const products = readCsv(path.join(DATA_DIR, "products.csv"));
  const imageRows = readCsv(path.join(DATA_DIR, "images.csv"));

  // Same SKU derivation as import.mjs, so ids line up with what's in the DB.
  const skuByIdProduct = new Map();
  for (const p of products) {
    const sku = (p.sku || "").trim() || `PS-${p.id_product}`;
    skuByIdProduct.set(p.id_product, sku);
  }

  // Group images by product, cover image first, then by position.
  const imagesByProduct = new Map();
  for (const row of imageRows) {
    const list = imagesByProduct.get(row.id_product) || [];
    list.push({
      idImage: row.id_image,
      position: parseInt(row.position, 10) || 0,
      cover: row.cover === "1",
    });
    imagesByProduct.set(row.id_product, list);
  }
  for (const list of imagesByProduct.values()) {
    list.sort((a, b) => (b.cover === a.cover ? a.position - b.position : b.cover ? 1 : -1));
  }

  if (!fs.existsSync(PHP_UPLOAD_DIR)) fs.mkdirSync(PHP_UPLOAD_DIR, { recursive: true });

  const sql = [
    "-- Generated by scripts/prestashop-import/import-images.mjs - safe to re-run.",
    "SET NAMES utf8mb4;",
    "",
  ];

  let productsUpdated = 0;
  let productsSkippedNoFile = 0;
  let imagesUploaded = 0;
  let processed = 0;

  for (const [idProduct, images] of imagesByProduct.entries()) {
    processed++;
    const sku = skuByIdProduct.get(idProduct);
    if (!sku) continue; // product not in products.csv (shouldn't normally happen)

    // Resolve on-disk files first - skip the whole product if none exist,
    // so we never wipe an existing (placeholder) image for nothing.
    const found = images
      .map((img) => ({ ...img, filePath: findImageFile(img.idImage) }))
      .filter((img) => img.filePath);

    if (found.length === 0) {
      productsSkippedNoFile++;
      continue;
    }

    const product = await withRetry(() =>
      prisma.product.findUnique({ where: { sku }, select: { id: true } })
    );
    if (!product) continue; // sku not actually imported into the DB (e.g. skipped for no category)

    const uploaded = [];
    for (const img of found) {
      const buffer = fs.readFileSync(img.filePath);
      const blob = await put(`products/${sku}-${img.idImage}.jpg`, buffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: true,
      });
      uploaded.push(blob.url);
      imagesUploaded++;

      // Mirror the same file onto local disk for the PHP/MySQL side.
      const phpFilename = `${sku}-${img.idImage}.jpg`;
      fs.copyFileSync(img.filePath, path.join(PHP_UPLOAD_DIR, phpFilename));
    }

    await withRetry(async () => {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.createMany({
        data: uploaded.map((url, i) => ({ productId: product.id, url, position: i })),
      });
    });

    sql.push(`DELETE FROM product_image WHERE product_id = (SELECT id FROM product WHERE sku = ${sqlStr(sku)});`);
    found.forEach((img, i) => {
      const url = `/uploads/products/${sku}-${img.idImage}.jpg`;
      sql.push(
        `INSERT INTO product_image (id, product_id, url, position) VALUES ` +
          `(${sqlStr(mysqlId())}, (SELECT id FROM product WHERE sku = ${sqlStr(sku)}), ${sqlStr(url)}, ${i});`
      );
    });

    productsUpdated++;
    if (productsUpdated % 50 === 0) {
      console.log(`  ...${productsUpdated} products updated so far (${processed}/${imagesByProduct.size} scanned)`);
    }
  }

  fs.writeFileSync(OUT_SQL, sql.join("\n"), "utf8");

  console.log(`\nDone.`);
  console.log(`  Products given real photos: ${productsUpdated}`);
  console.log(`  Images uploaded: ${imagesUploaded}`);
  console.log(`  Products skipped (no matching file found on disk): ${productsSkippedNoFile}`);
  console.log(`  PHP files copied to: ${PHP_UPLOAD_DIR}`);
  console.log(`  MySQL file written to: ${OUT_SQL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
