<?php
// Mirrors src/lib/order-status.ts in the Next.js version - same status
// labels, same pill colors, same quick-order detection - so the PHP admin
// panel never disagrees with the (retired) Next.js one on these rules.

function order_status_labels(): array {
    return [
        'pending'   => 'Нова',
        'confirmed' => 'Потвърдена',
        'shipped'   => 'Изпратена',
        'delivered' => 'Доставена',
        'cancelled' => 'Отказана',
    ];
}

function order_status_label(string $status): string {
    $labels = order_status_labels();
    return $labels[$status] ?? $status;
}

function order_status_pill_class(string $status): string {
    switch ($status) {
        case 'pending':
            return 'pill pill--warn';
        case 'confirmed':
        case 'shipped':
            return 'pill pill--info';
        case 'delivered':
            return 'pill pill--ok';
        case 'cancelled':
            return 'pill pill--muted';
        default:
            return 'pill pill--warn';
    }
}

function is_quick_order(?string $deliveryMethod): bool {
    return $deliveryMethod === 'quick_order';
}
