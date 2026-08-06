<?php
// "Бърза поръчка" - one-tap order with just name + phone, no cart/checkout.
// Mirrors src/app/api/quick-order/route.ts in the Next.js version: same
// validation rules, same live-stock re-check, same TQ order-number prefix,
// same deliveryMethod = 'quick_order' marker used everywhere downstream.
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$productId = trim($_POST['product_id'] ?? '');
$size = trim($_POST['size'] ?? '');
$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');

$product = $productId !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$productId]) : null;

if (!$product) {
    redirect_to('/index.php');
}

$backUrl = '/product.php?slug=' . urlencode($product['slug']);

if ($size === '') {
    redirect_to($backUrl . '&quick_error=1');
}
if (mb_strlen($name) < 2) {
    redirect_to($backUrl . '&quick_error=1');
}
$phoneDigits = preg_replace('/[^0-9+]/', '', $phone);
if (mb_strlen($phoneDigits) < 6) {
    redirect_to($backUrl . '&quick_error=1');
}

// Never trust the client on stock/size validity - re-check live before
// placing the order, same principle as add-to-cart.php and checkout.php.
$variant = db_one('SELECT * FROM product_variant WHERE product_id = ? AND size = ?', [$productId, $size]);
if (!$variant || (int)$variant['stock'] <= 0) {
    redirect_to($backUrl . '&quick_error=1');
}

$orderId = db_id();
$orderNumber = 'TQ' . strtoupper(substr($orderId, 0, 8));

db_query(
    'INSERT INTO `order`
        (id, order_number, customer_id, guest_name, guest_email, guest_phone, address, city, delivery_method, office_name, status, total_bgn, total_eur)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
        $orderId, $orderNumber,
        $name, '', $phone,
        '', '', 'quick_order', '',
        'pending', $product['price_bgn'], $product['price_eur'],
    ]
);

db_query(
    'INSERT INTO order_item (id, order_id, product_id, product_name, size, color, qty, price_bgn, price_eur)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [db_id(), $orderId, $productId, $product['name'], $size, $variant['color'], 1, $product['price_bgn'], $product['price_eur']]
);

db_query('UPDATE product_variant SET stock = GREATEST(stock - 1, 0) WHERE id = ?', [$variant['id']]);

redirect_to($backUrl . '&quick_ok=1&quick_order_number=' . urlencode($orderNumber) . '&quick_phone=' . urlencode($phone));
