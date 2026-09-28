import { formatEur, formatBgn } from "./format";

// Sends transactional email via Resend's HTTP API (https://resend.com) using
// a plain fetch() call - deliberately NOT the nodemailer/SMTP route, so this
// needs no new npm package (and therefore no package-lock.json update,
// which isn't possible to run from here without a working shell). Needs
// RESEND_API_KEY set as a Vercel env var; until that's configured, sendMail
// just logs a warning and returns false - a missing/misconfigured key must
// never block an order from completing.
//
// Setup (once you're ready): create a free account at resend.com, get an API
// key, add RESEND_API_KEY to Vercel's env vars. You can send test emails
// from their shared "onboarding@resend.dev" address with zero extra setup;
// sending from your own "@topstyle.bg" address needs domain verification in
// Resend's dashboard (best done once the real domain is live) - set
// EMAIL_FROM once that's done, e.g. "TopStyle.bg <poruchki@topstyle.bg>".
export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!opts.to) return false;
  if (!apiKey) {
    console.warn("sendMail: RESEND_API_KEY not set - skipping email send.");
    return false;
  }
  const from = process.env.EMAIL_FROM || "TopStyle.bg <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) console.error("sendMail: Resend API returned", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("sendMail failed:", err);
    return false;
  }
}

type OrderEmailItem = { productName: string; size: string; qty: number; priceEur: number };

// Shared HTML body for both emails below - plain inline-styled tags only (no
// external CSS/images), which every inbox renders reliably.
function buildOrderEmailHtml(
  heading: string,
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  totalEur: number,
  totalBgn: number,
  deliveryText: string
): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = items
    .map(
      (it) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee;">${esc(it.productName)} (${esc(it.size)})</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center;">× ${it.qty}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${formatEur(it.priceEur * it.qty)}</td>
        </tr>`
    )
    .join("");
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
      <h2 style="margin-bottom:4px;">${esc(heading)}</h2>
      <p style="color:#555;margin-top:0;">Поръчка №${esc(orderNumber)}</p>
      <p><strong>Клиент:</strong> ${esc(customerName)}</p>
      <p><strong>Доставка:</strong> ${esc(deliveryText)}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>
      <p style="text-align:right;font-weight:bold;margin-top:12px;">Общо: ${formatEur(totalEur)} / ${formatBgn(totalBgn)}</p>
    </div>`;
}

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  totalEur: number,
  totalBgn: number,
  deliveryText: string
) {
  if (!customerEmail) return; // quick orders don't collect an email
  const html = buildOrderEmailHtml("Благодарим за поръчката!", orderNumber, customerName, items, totalEur, totalBgn, deliveryText);
  await sendMail({ to: customerEmail, subject: `Поръчка №${orderNumber} е приета — TopStyle.bg`, html });
}

export async function sendAdminOrderNotificationEmail(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  totalEur: number,
  totalBgn: number,
  deliveryText: string
) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return; // not configured - skip silently
  const html = buildOrderEmailHtml(`Нова поръчка №${orderNumber}`, orderNumber, customerName, items, totalEur, totalBgn, deliveryText);
  await sendMail({ to: adminEmail, subject: `Нова поръчка №${orderNumber}`, html });
}
