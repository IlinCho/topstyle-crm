<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/cart.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$productId = trim($_POST['product_id'] ?? '');
$size = trim($_POST['size'] ?? '');
$qty = max(1, (int)($_POST['qty'] ?? 1));

$product = $productId !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$productId]) : null;

if (!$product || $size === '') {
    redirect_to('/index.php');
}

$variant = db_one(
    'SELECT * FROM product_variant WHERE product_id = ? AND size = ?',
    [$productId, $size]
);

// Never trust the client on stock/size validity - re-check live before adding,
// same principle as the live-stock checks on cart/checkout.
if (!$variant || (int)$variant['stock'] <= 0) {
    redirect_to('/product.php?slug=' . urlencode($product['slug']) . '&outofstock=1');
}

cart_add($productId, $size, $variant['color'], $qty);
redirect_to('/cart.php?added=1');
