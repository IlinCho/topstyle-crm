<?php
// Simple, dependency-free transactional email via PHP's built-in mail() -
// works out of the box on Jump.bg/cPanel with zero extra setup (no SMTP
// library needed). Actual inbox deliverability (not landing in spam) depends
// on the domain's SPF/DKIM DNS records, which only take effect once the real
// domain is pointed at Jump.bg - fine to test with during the temporary-URL
// phase, just don't expect perfect deliverability until the domain is live.
//
// Every send is wrapped in a try/catch-equivalent (mail() just returns
// false on failure) and NEVER throws - a broken mail server must never stop
// an order from being placed. Worst case: the order saves, no email goes
// out, and the admin still sees it in Табло/Поръчки.

function send_mail(string $to, string $subject, string $htmlBody): bool {
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) return false;

    $fromEmail = (defined('STORE_EMAIL') && STORE_EMAIL !== '')
        ? STORE_EMAIL
        : ('no-reply@' . preg_replace('#^https?://(www\.)?#', '', rtrim(SITE_URL, '/')));

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= 'From: =?UTF-8?B?' . base64_encode(STORE_NAME) . '?= <' . $fromEmail . ">\r\n";
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    return @mail($to, $encodedSubject, $htmlBody, $headers);
}

// Shared HTML body for both emails below - a plain, readable order summary
// table. Deliberately no external images/CSS frameworks (many inboxes strip
// them anyway) - just inline styles on plain tags, which every mail client
// renders reliably.
function build_order_email_html(string $heading, string $orderNumber, string $customerName, array $items, float $totalEur, float $totalBgn, string $deliveryText): string {
    $rows = '';
    foreach ($items as $it) {
        $rows .= '<tr>'
            . '<td style="padding:6px 0;border-bottom:1px solid #eee;">' . e($it['product_name']) . ' (' . e($it['size']) . ')</td>'
            . '<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center;">× ' . (int)$it['qty'] . '</td>'
            . '<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">' . format_eur($it['price_eur'] * $it['qty']) . '</td>'
            . '</tr>';
    }
    return '
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
      <h2 style="margin-bottom:4px;">' . e($heading) . '</h2>
      <p style="color:#555;margin-top:0;">Поръчка №' . e($orderNumber) . '</p>
      <p><strong>Клиент:</strong> ' . e($customerName) . '</p>
      <p><strong>Доставка:</strong> ' . e($deliveryText) . '</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">' . $rows . '</table>
      <p style="text-align:right;font-weight:bold;margin-top:12px;">Общо: ' . format_eur($totalEur) . ' / ' . format_bgn($totalBgn) . '</p>
    </div>';
}

// Called once, right after an order (checkout.php or quick-order.php) is
// successfully saved to the database.
function send_order_confirmation_email(string $customerEmail, string $orderNumber, string $customerName, array $items, float $totalEur, float $totalBgn, string $deliveryText): void {
    if ($customerEmail === '') return; // quick orders don't collect an email
    $html = build_order_email_html('Благодарим за поръчката!', $orderNumber, $customerName, $items, $totalEur, $totalBgn, $deliveryText);
    send_mail($customerEmail, 'Поръчка №' . $orderNumber . ' е приета — ' . STORE_NAME, $html);
}

function send_admin_order_notification_email(string $orderNumber, string $customerName, array $items, float $totalEur, float $totalBgn, string $deliveryText): void {
    if (!defined('ADMIN_NOTIFY_EMAIL') || ADMIN_NOTIFY_EMAIL === '') return; // not configured - skip silently
    $html = build_order_email_html('Нова поръчка №' . $orderNumber, $orderNumber, $customerName, $items, $totalEur, $totalBgn, $deliveryText);
    send_mail(ADMIN_NOTIFY_EMAIL, 'Нова поръчка №' . $orderNumber, $html);
}
