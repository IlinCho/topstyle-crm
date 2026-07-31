<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$productId = trim($_POST['product_id'] ?? '');
$authorName = trim($_POST['author_name'] ?? '');
$rating = (int)($_POST['rating'] ?? 0);
$comment = trim($_POST['comment'] ?? '');

$product = $productId !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$productId]) : null;

if (!$product || $authorName === '' || $rating < 1 || $rating > 5) {
    redirect_to($product ? '/product.php?slug=' . urlencode($product['slug']) . '&review_error=1#reviews' : '/index.php');
}

db_query(
    'INSERT INTO review (id, product_id, author_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [db_id(), $productId, $authorName, $rating, $comment]
);

redirect_to('/product.php?slug=' . urlencode($product['slug']) . '&review_ok=1#reviews');
