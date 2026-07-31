<?php
// Smart Scarcity Intelligence - single source of truth for turning REAL
// per-variant stock numbers into a customer-facing message. Every message is
// a direct function of the real $stock value - never a fabricated or
// identical-for-every-product claim.

function get_scarcity(int $stock): array {
    if ($stock <= 0) return ['icon' => '⛔', 'text' => 'Изчерпан', 'tone' => 'out'];
    if ($stock === 1) return ['icon' => '🔴', 'text' => 'Последен наличен брой', 'tone' => 'danger'];
    if ($stock <= 4) return ['icon' => '🟠', 'text' => "Остават само {$stock} броя", 'tone' => 'warn'];
    if ($stock <= 9) return ['icon' => '🟠', 'text' => 'Остават няколко броя', 'tone' => 'warn'];
    if ($stock <= 20) return ['icon' => '🟡', 'text' => 'Ограничена наличност', 'tone' => 'info'];
    return ['icon' => '✔', 'text' => 'В наличност', 'tone' => 'ok'];
}

function is_critical_stock(int $stock): bool {
    return $stock <= 1;
}

function get_compact_stock_hint(int $stock): ?string {
    if ($stock <= 0) return null;
    if ($stock <= 4) return "{$stock} бр.";
    if ($stock <= 9) return 'малко';
    return null;
}

function render_scarcity_badge(int $stock): string {
    $s = get_scarcity($stock);
    return '<p class="scarcity-badge scarcity-badge--' . e($s['tone']) . '">'
        . '<span aria-hidden="true">' . $s['icon'] . '</span> ' . e($s['text'])
        . '</p>';
}
