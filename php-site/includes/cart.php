<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/customer_auth.php';

// The cart rides on the SAME session as the customer login (topstyle_customer_session)
// instead of a separate cookie. This means a guest's cart naturally survives
// them logging in mid-shop (session_regenerate_id keeps $_SESSION data, only
// the id/cookie changes) - no cart-merge logic needed.
function cart_start(): void {
    start_customer_session(true);
    if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }
}

function cart_key(string $productId, string $size, string $color): string {
    return $productId . '|' . $size . '|' . $color;
}

function cart_add(string $productId, string $size, string $color, int $qty = 1): void {
    cart_start();
    $key = cart_key($productId, $size, $color);
    if (isset($_SESSION['cart'][$key])) {
        $_SESSION['cart'][$key]['qty'] += $qty;
    } else {
        $_SESSION['cart'][$key] = [
            'product_id' => $productId,
            'size' => $size,
            'color' => $color,
            'qty' => $qty,
        ];
    }
}

function cart_update_qty(string $key, int $qty): void {
    cart_start();
    if ($qty <= 0) {
        unset($_SESSION['cart'][$key]);
        return;
    }
    if (isset($_SESSION['cart'][$key])) {
        $_SESSION['cart'][$key]['qty'] = $qty;
    }
}

function cart_remove(string $key): void {
    cart_start();
    unset($_SESSION['cart'][$key]);
}

function cart_count(): int {
    cart_start();
    $count = 0;
    foreach ($_SESSION['cart'] as $item) {
        $count += (int)$item['qty'];
    }
    return $count;
}

function cart_is_empty(): bool {
    cart_start();
    return count($_SESSION['cart']) === 0;
}

// Joins the raw session cart (just ids/size/color/qty) with live DB rows, so
// price and stock shown to the user are never trusted from the session -
// always read fresh at request time.
function cart_line_items(): array {
    cart_start();
    $lines = [];
    foreach ($_SESSION['cart'] as $key => $item) {
        $product = db_one('SELECT * FROM product WHERE id = ?', [$item['product_id']]);
        if (!$product) continue;
        $variant = db_one(
            'SELECT * FROM product_variant WHERE product_id = ? AND size = ? AND color = ?',
            [$item['product_id'], $item['size'], $item['color']]
        );
        $image = db_one(
            'SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1',
            [$item['product_id']]
        );
        $lines[] = [
            'key' => $key,
            'product' => $product,
            'image_url' => $image ? $image['url'] : null,
            'size' => $item['size'],
            'color' => $item['color'],
            'qty' => (int)$item['qty'],
            'stock' => $variant ? (int)$variant['stock'] : 0,
        ];
    }
    return $lines;
}

function cart_totals(array $lines): array {
    $bgn = 0.0;
    $eur = 0.0;
    foreach ($lines as $line) {
        $bgn += (float)$line['product']['price_bgn'] * $line['qty'];
        $eur += (float)$line['product']['price_eur'] * $line['qty'];
    }
    return ['bgn' => $bgn, 'eur' => $eur];
}

function cart_clear(): void {
    cart_start();
    $_SESSION['cart'] = [];
}
