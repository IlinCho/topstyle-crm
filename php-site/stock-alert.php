<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$productId = trim($_POST['product_id'] ?? '');
$size = trim($_POST['size'] ?? '');
$email = trim($_POST['email'] ?? '');

$product = $productId !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$productId]) : null;

if (!$product || $size === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_to($product ? '/product.php?slug=' . urlencode($product['slug']) . '&alert_error=1' : '/index.php');
}

$variant = db_one('SELECT * FROM product_variant WHERE product_id = ? AND size = ?', [$productId, $size]);
$color = $variant ? $variant['color'] : '';

db_query(
    'INSERT INTO stock_alert (id, product_id, size, color, email) VALUES (?, ?, ?, ?, ?)',
    [db_id(), $productId, $size, $color, $email]
);

redirect_to('/product.php?slug=' . urlencode($product['slug']) . '&alert_ok=1');
