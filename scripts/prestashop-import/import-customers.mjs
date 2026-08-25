#!/usr/bin/env node
/**
 * Imports the old topstyle.bg (PrestaShop) customer list into the
 * LegacyCustomer reference table - the same table the admin's "Стари
 * клиенти" page (Admin -> Стари клиенти) lets you paste into by hand, just
 * automated for a large real export instead of manual copy/paste.
 *
 * This is a REFERENCE list only (email/phone/name, normalized) - it's used
 * purely to tag new orders as "Стар клиент" vs "Нов клиент" by matching
 * email/phone (see src/lib/legacy-customers.ts). It does NOT create real
 * Customer accounts or carry over order history.
 *
 * SETUP - before running, export the old customers with this query in
 * PrestaShop's SQL Manager (phone numbers live on the address, not the
 * customer, in stock PrestaShop - this picks the first non-empty mobile or
 * landline number found across the customer's addresses):
 *
 *   SELECT c.id_customer,
 *          c.email,
 *          COALESCE(
 *            (SELECT a.phone_mobile FROM ps_address a WHERE a.id_customer = c.id_customer AND a.deleted = 0 AND a.phone_mobile <> '' ORDER BY a.id_address LIMIT 1),
 *            (SELECT a.phone FROM ps_address a WHERE a.id_customer = c.id_customer AND a.deleted = 0 AND a.phone <> '' ORDER BY a.id_address LIMIT 1),
 *            ''
 *          ) AS phone,
 *          CONCAT(c.firstname, ' ', c.lastname) AS name
 *   FROM ps_customer c
 *   WHERE c.deleted = 0;
 *
 * Download the result and save it as exactly:
 *   scripts/prestashop-import/Data/customers.csv
 *
 * RUN:
 *   node scripts/prestashop-import/import-customers.mjs
 *
 * Safe to re-run - skips any email/phone pair already present in
 * LegacyCustomer (locally in this run, and against what's already in the
 * live DB), so re-running with a fresher export never creates duplicates.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "Data");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const OUT_SQL = path.join(__dirname, "mysql-customers.sql");

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
    process.env[key] = value;
  }
}
loadEnvFile();

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

// Same normalization as src/lib/legacy-customers.ts - MUST match exactly,
// since matching happens by comparing these normalized strings.
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}
function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.slice(-9);
}

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

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${filePath}\nExport customers.csv from PrestaShop's SQL Manager first - see the comment at the top of this script.`
    );
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
        err?.code === "P2024" ||
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

async function main() {
  console.log("Reading customers.csv...");
  const rows = readCsv("customers.csv");
  console.log(`${rows.length} customers in export.`);

  // Existing rows already in the live DB (from an earlier run of this
  // script, or manually pasted via the admin page) - keyed so a re-run
  // never inserts the same person twice.
  const existing = await prisma.legacyCustomer.findMany({ select: { email: true, phone: true } });
  const seen = new Set(existing.map((r) => `${r.email}|${r.phone}`));

  const toInsert = [];
  const sql = [
    "-- Generated by scripts/prestashop-import/import-customers.mjs - safe to re-run.",
    "SET NAMES utf8mb4;",
    "",
  ];

  let skippedNoContact = 0;
  let skippedDuplicate = 0;

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    const phone = normalizePhone(row.phone);
    const name = (row.name || "").trim();

    if (!email && !phone) {
      skippedNoContact++;
      continue;
    }

    const key = `${email}|${phone}`;
    if (seen.has(key)) {
      skippedDuplicate++;
      continue;
    }
    seen.add(key);
    toInsert.push({ email, phone, name });
  }

  console.log(`Inserting ${toInsert.length} new legacy customers (skipped ${skippedDuplicate} duplicates, ${skippedNoContact} with no email/phone at all)...`);

  // createMany in chunks - a single call with tens of thousands of rows can
  // itself trip the same connection-pool/timeout issues as the per-product
  // loops in the other scripts.
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    await withRetry(() => prisma.legacyCustomer.createMany({ data: chunk }));
    inserted += chunk.length;
    console.log(`  ...${inserted}/${toInsert.length} inserted so far`);

    for (const c of chunk) {
      sql.push(
        `INSERT INTO legacy_customer (id, email, phone, name) VALUES (${sqlStr(mysqlId())}, ${sqlStr(c.email)}, ${sqlStr(c.phone)}, ${sqlStr(c.name)});`
      );
    }
  }

  fs.writeFileSync(OUT_SQL, sql.join("\n"), "utf8");

  console.log(`\nDone.`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped as duplicates: ${skippedDuplicate}`);
  console.log(`  Skipped (no email or phone at all): ${skippedNoContact}`);
  console.log(`  MySQL file written to: ${OUT_SQL}`);
  console.log(`\nOptional next step: run "Преизчисли поръчките" on Admin -> Стари клиенти,`);
  console.log(`so any existing orders placed before this import get re-checked against the new list.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
