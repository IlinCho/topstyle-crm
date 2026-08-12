<?php
$activeNav = 'orders';
$pageTitle = 'Поръчки';
require __DIR__ . '/../includes/admin-header.php';
require_once __DIR__ . '/../includes/order_status.php';

$__validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $orderId = trim($_POST['order_id'] ?? '');
    $status = trim($_POST['status'] ?? '');
    if ($orderId !== '' && in_array($status, $__validStatuses, true)) {
        $__existingOrder = db_one('SELECT status FROM `order` WHERE id = ?', [$orderId]);
        if ($__existingOrder) {
            db_query('UPDATE `order` SET status = ? WHERE id = ?', [$status, $orderId]);

            // Cancelling an order releases its reserved stock back to the
            // catalog; un-cancelling (moving it to any other status
            // afterwards) takes it back out again, so the two operations
            // stay symmetric instead of quietly inflating stock if an admin
            // toggles a cancellation by mistake.
            $__wasCancelled = $__existingOrder['status'] === 'cancelled';
            $__isCancelled = $status === 'cancelled';
            if ($__wasCancelled !== $__isCancelled) {
                $__sign = $__isCancelled ? 1 : -1;
                $__items = db_all('SELECT * FROM order_item WHERE order_id = ?', [$orderId]);
                foreach ($__items as $__it) {
                    if (empty($__it['product_id'])) continue;
                    db_query(
                        'UPDATE product_variant SET stock = GREATEST(stock + (? * ?), 0) WHERE product_id = ? AND size = ? AND color = ?',
                        [$__sign, $__it['qty'], $__it['product_id'], $__it['size'], $__it['color']]
                    );
                }
            }
        }
    }
    redirect_to('/admin/orders.php' . (isset($_GET['id']) ? '?id=' . urlencode($_GET['id']) : ''));
}

$__viewId = isset($_GET['id']) ? trim($_GET['id']) : '';
$__viewOrder = $__viewId !== '' ? db_one('SELECT * FROM `order` WHERE id = ?', [$__viewId]) : null;

if ($__viewOrder) {
    // Opening the order's detail page is what clears it off the sidebar bell -
    // same as any other notification list.
    if (!(int)$__viewOrder['seen_by_admin']) {
        db_query('UPDATE `order` SET seen_by_admin = 1 WHERE id = ?', [$__viewOrder['id']]);
        $__viewOrder['seen_by_admin'] = 1;
    }
    $__items = db_all(
        'SELECT oi.*, p.sku AS product_sku FROM order_item oi LEFT JOIN product p ON p.id = oi.product_id WHERE oi.order_id = ?',
        [$__viewOrder['id']]
    );
    ?>
    <div class="admin-topbar">
      <h1 class="admin-h1">
        Поръчка №<?= e($__viewOrder['order_number']) ?>
        <?php if (is_quick_order($__viewOrder['delivery_method'])): ?>
          <span class="pill pill--warn" style="margin-left:8px;">⚡ бърза поръчка</span>
        <?php else: ?>
          <span class="pill pill--muted" style="margin-left:8px;">обикновена</span>
        <?php endif; ?>
        <span class="<?= e(order_status_pill_class($__viewOrder['status'])) ?>" style="margin-left:4px;"><?= e(order_status_label($__viewOrder['status'])) ?></span>
      </h1>
      <a href="/admin/orders.php" class="btn btn--ghost">Назад към всички поръчки</a>
    </div>

    <div class="card-box">
      <p><strong>Клиент:</strong> <?= e($__viewOrder['guest_name']) ?> · <?= e($__viewOrder['guest_email']) ?> · <?= e($__viewOrder['guest_phone']) ?></p>
      <?php if (is_quick_order($__viewOrder['delivery_method'])): ?>
        <p class="error-text"><strong>⚠ Доставка:</strong> Бърза поръчка — липсва адрес, обади се на клиента</p>
      <?php else: ?>
        <p><strong>Доставка:</strong>
          <?= $__viewOrder['delivery_method'] === 'office'
                ? 'Офис на куриер — ' . e($__viewOrder['office_name'])
                : 'Адрес — ' . e($__viewOrder['address']) . ', ' . e($__viewOrder['city']) ?>
        </p>
      <?php endif; ?>
      <p><strong>Дата:</strong> <?= e(date('d.m.Y H:i', strtotime($__viewOrder['created_at']))) ?></p>

      <form method="POST" action="/admin/orders.php?id=<?= e($__viewOrder['id']) ?>" style="margin-top:12px;">
        <input type="hidden" name="update_status" value="1">
        <input type="hidden" name="order_id" value="<?= e($__viewOrder['id']) ?>">
        <div class="field" style="max-width:240px;">
          <label>Статус</label>
          <select name="status">
            <?php foreach ($__validStatuses as $__s): ?>
              <option value="<?= e($__s) ?>" <?= $__viewOrder['status'] === $__s ? 'selected' : '' ?>><?= e(order_status_label($__s)) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <button type="submit" class="btn btn--sm">Обнови статус</button>
      </form>
    </div>

    <div class="card-box">
      <h3 style="margin-top:0;">Артикули</h3>
      <table class="admin-table">
        <thead><tr><th>Код</th><th>Продукт</th><th>Размер</th><th>Бр.</th><th>Цена</th></tr></thead>
        <tbody>
          <?php foreach ($__items as $__it): ?>
            <tr>
              <td class="muted"><?= e($__it['product_sku'] ?? '') ?: '—' ?></td>
              <td><?= e($__it['product_name']) ?></td>
              <td><?= e($__it['size']) ?></td>
              <td><?= (int)$__it['qty'] ?></td>
              <td><?= format_bgn($__it['price_bgn'] * $__it['qty']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <p class="mt-24"><strong>Общо: <?= format_bgn($__viewOrder['total_bgn']) ?> / <?= format_eur($__viewOrder['total_eur']) ?></strong></p>
    </div>
    <?php
} else {
    $__orders = db_all('SELECT * FROM `order` ORDER BY created_at DESC');
    ?>
    <div class="admin-topbar">
      <h1 class="admin-h1">Поръчки</h1>
    </div>
    <div class="card-box">
      <?php if (!$__orders): ?>
        <p class="muted">Все още няма поръчки.</p>
      <?php else: ?>
        <table class="admin-table">
          <thead><tr><th></th><th>Номер</th><th>Клиент</th><th>Тип</th><th>Град</th><th>Статус</th><th>Сума</th><th>Дата</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($__orders as $__o): ?>
              <tr <?= !(int)$__o['seen_by_admin'] ? 'style="font-weight:700;"' : '' ?>>
                <td><?php if (!(int)$__o['seen_by_admin']): ?><span title="Нова поръчка">🔔</span><?php endif; ?></td>
                <td>№<?= e($__o['order_number']) ?></td>
                <td><?= e($__o['guest_name']) ?></td>
                <td>
                  <?php if (is_quick_order($__o['delivery_method'])): ?>
                    <span class="pill pill--warn">⚡ бърза</span>
                  <?php else: ?>
                    <span class="pill pill--muted">обикновена</span>
                  <?php endif; ?>
                </td>
                <td><?= $__o['city'] ? e($__o['city']) : (is_quick_order($__o['delivery_method']) ? '— обади се за адрес' : '') ?></td>
                <td><span class="<?= e(order_status_pill_class($__o['status'])) ?>"><?= e(order_status_label($__o['status'])) ?></span></td>
                <td><?= format_bgn($__o['total_bgn']) ?></td>
                <td><?= e(date('d.m.Y', strtotime($__o['created_at']))) ?></td>
                <td><a href="/admin/orders.php?id=<?= e($__o['id']) ?>" class="btn btn--ghost btn--sm">Детайли</a></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
    <?php
}
require __DIR__ . '/../includes/admin-footer.php';
?>
