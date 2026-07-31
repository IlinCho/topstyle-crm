<?php
// Rating aggregation + small star-render helper shared by the product card,
// product page, and reviews list.

function get_product_rating(string $productId): array {
    $row = db_one(
        'SELECT COUNT(*) AS c, AVG(rating) AS avg_rating FROM review WHERE product_id = ?',
        [$productId]
    );
    $count = $row ? (int)$row['c'] : 0;
    $avg = $row && $row['avg_rating'] !== null ? round((float)$row['avg_rating'], 1) : 0.0;
    return ['count' => $count, 'avg' => $avg];
}

function render_rating_stars(float $avg, int $count, string $size = 'md'): string {
    $full = (int)floor($avg);
    $half = ($avg - $full) >= 0.5 ? 1 : 0;
    $empty = 5 - $full - $half;

    $html = '<div class="rating-stars rating-stars--' . e($size) . '"><span class="rating-stars__icons" aria-hidden="true">';
    for ($i = 0; $i < $full; $i++) $html .= '<span class="star star--full">&#9733;</span>';
    if ($half) $html .= '<span class="star star--half">&#9733;</span>';
    for ($i = 0; $i < $empty; $i++) $html .= '<span class="star">&#9733;</span>';
    $html .= '</span>';

    if ($count > 0) {
        $html .= '<span class="rating-stars__text">' . number_format($avg, 1) . ' (' . (int)$count . ' отзива)</span>';
    } else {
        $html .= '<span class="rating-stars__text">Все още няма отзиви</span>';
    }
    $html .= '</div>';
    return $html;
}
