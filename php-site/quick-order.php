<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

// "Бърза поръчка" - a one-tap order straight from the product page: just
// name + phone, no address/checkout wizard. The store calls the customer
// back to confirm delivery details. Mirrors src/app/api/quick-order/route.ts
// in the Next.js version. Deliberately its own endpoint (not a variant of
// checkout.php) because the required-field set is genuinely different - full
// checkout requires city/delivery method, this doesn't.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$productId = trim($_POST['product_id'] ?? '');
$size = trim($_POST['size'] ?? '');
$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');

$product = $productId !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$productId]) : null;

if (!$product || $size === '') {
    redirect_to('/index.php');
}

$phoneDigits = preg_replace('/[^0-9+]/', '', $phone);
if (mb_strlen($name, 'UTF-8') < 2 || strlen($phoneDigits) < 6) {
    redirect_to('/product.php?slug=' . urlencode($product['slug']) . '&quick_error=1');
}

// Never trust stock from the client - re-check live before placing, same
// principle as add-to-cart.php.
$variant = db_one('SELECT * FROM product_variant WHERE product_id = ? AND size = ?', [$productId, $size]);
if (!$variant || (int)$variant['stock'] <= 0) {
    redirect_to('/product.php?slug=' . urlencode($product['slug']) . '&outofstock=1');
}

// Matched once, at creation time, against the admin-imported list of old
// PrestaShop customers - quick orders only ever collect a phone (no email
// field in that form), so matching relies on phone alone here.
$isLegacy = check_is_legacy('', $phone) ? 1 : 0;

$orderId = db_id();
$orderNumber = strtoupper(substr($orderId, 0, 8));
$totalBgn = (float)$product['price_bgn'];
$totalEur = (float)$product['price_eur'];

db_query(
    'INSERT INTO `order`
        (id, order_number, customer_id, guest_name, guest_email, guest_phone, address, city, delivery_method, office_name, status, is_legacy, total_bgn, total_eur)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [$orderId, $orderNumber, $name, '', $phone, '', '', 'quick_order', '', 'pending', $isLegacy, $totalBgn, $totalEur]
);

db_query(
    'INSERT INTO order_item (id, order_id, product_id, product_name, size, color, qty, price_bgn, price_eur)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [db_id(), $orderId, $productId, $product['name'], $size, $variant['color'], 1, $product['price_bgn'], $product['price_eur']]
);

db_query('UPDATE product_variant SET stock = GREATEST(stock - 1, 0) WHERE id = ?', [$variant['id']]);

redirect_to('/product.php?slug=' . urlencode($product['slug'])
    . '&quick_ok=1&quick_order_number=' . urlencode($orderNumber) . '&quick_phone=' . urlencode($phone));
