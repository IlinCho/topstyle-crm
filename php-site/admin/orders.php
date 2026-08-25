<?php
$activeNav = 'orders';
$pageTitle = 'Поръчки';
require __DIR__ . '/../includes/admin-header.php';

$__validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status']) && verify_csrf_token($_POST['csrf_token'] ?? '')) {
    $orderId = trim($_POST['order_id'] ?? '');
    $status = trim($_POST['status'] ?? '');
    if ($orderId !== '' && in_array($status, $__validStatuses, true)) {
        db_query('UPDATE `order` SET status = ? WHERE id = ?', [$status, $orderId]);
    }
    redirect_to('/admin/orders.php' . (isset($_GET['id']) ? '?id=' . urlencode($_GET['id']) : ''));
}

$__viewId = isset($_GET['id']) ? trim($_GET['id']) : '';
$__viewOrder = $__viewId !== '' ? db_one(
    'SELECT o.*, c.password_hash AS customer_password_hash FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id WHERE o.id = ?',
    [$__viewId]
) : null;

if ($__viewOrder) {
    $__items = db_all('SELECT * FROM order_item WHERE order_id = ?', [$__viewOrder['id']]);
    $__repeatIndex = build_repeat_index();
    $__isRepeat = is_repeat_in_index($__repeatIndex, $__viewOrder['guest_email'], $__viewOrder['guest_phone']);
    ?>
    <div class="admin-topbar">
      <h1 class="admin-h1">
        Поръчка №<?= e($__viewOrder['order_number']) ?>
        <?php if ((int)$__viewOrder['is_legacy'] === 1): ?>
          <span class="pill pill--info" style="margin-left:6px;">🕐 Стар клиент</span>
        <?php else: ?>
          <span class="pill pill--ok" style="margin-left:6px;">✨ Нов клиент</span>
        <?php endif; ?>
        <?php if (!empty($__viewOrder['customer_password_hash'])): ?>
          <span class="pill pill--ok" style="margin-left:4px;">Регистриран</span>
        <?php else: ?>
          <span class="pill pill--muted" style="margin-left:4px;">Гост</span>
        <?php endif; ?>
        <?php if ($__isRepeat): ?>
          <span class="pill pill--info" style="margin-left:4px;">🔁 Повторен клиент</span>
        <?php endif; ?>
      </h1>
      <a href="/admin/orders.php" class="btn btn--ghost">Назад към всички поръчки</a>
    </div>

    <div class="card-box">
      <p><strong>Клиент:</strong> <?= e($__viewOrder['guest_name']) ?> · <?= e($__viewOrder['guest_email']) ?> · <?= e($__viewOrder['guest_phone']) ?></p>
      <p><strong>Доставка:</strong>
        <?= $__viewOrder['delivery_method'] === 'office'
              ? 'Офис на куриер — ' . e($__viewOrder['office_name'])
              : 'Адрес — ' . e($__viewOrder['address']) . ', ' . e($__viewOrder['city']) ?>
      </p>
      <p><strong>Дата:</strong> <?= e(date('d.m.Y H:i', strtotime($__viewOrder['created_at']))) ?></p>

      <form method="POST" action="/admin/orders.php?id=<?= e($__viewOrder['id']) ?>" style="margin-top:12px;">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="update_status" value="1">
        <input type="hidden" name="order_id" value="<?= e($__viewOrder['id']) ?>">
        <div class="field" style="max-width:240px;">
          <label>Статус</label>
          <select name="status">
            <?php foreach ($__validStatuses as $__s): ?>
              <option value="<?= e($__s) ?>" <?= $__viewOrder['status'] === $__s ? 'selected' : '' ?>><?= e($__s) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <button type="submit" class="btn btn--sm">Обнови статус</button>
      </form>
    </div>

    <div class="card-box">
      <h3 style="margin-top:0;">Артикули</h3>
      <table class="admin-table">
        <thead><tr><th>Продукт</th><th>Размер</th><th>Бр.</th><th>Цена</th></tr></thead>
        <tbody>
          <?php foreach ($__items as $__it): ?>
            <tr>
              <td><?= e($__it['product_name']) ?></td>
              <td><?= e($__it['size']) ?></td>
              <td><?= (int)$__it['qty'] ?></td>
              <td><?= format_eur($__it['price_eur'] * $__it['qty']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <p class="mt-24"><strong>Общо: <?= format_eur($__viewOrder['total_eur']) ?></strong></p>
    </div>
    <?php
} else {
    $__orders = db_all(
        'SELECT o.*, c.password_hash AS customer_password_hash FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id ORDER BY o.created_at DESC'
    );
    $__repeatIndex = build_repeat_index();
    ?>
    <div class="admin-topbar">
      <h1 class="admin-h1">Поръчки</h1>
    </div>
    <div class="card-box">
      <?php if (!$__orders): ?>
        <p class="muted">Все още няма поръчки.</p>
      <?php else: ?>
        <table class="admin-table">
          <thead><tr><th>Номер</th><th>Клиент</th><th>История</th><th>Повторен</th><th>Акаунт</th><th>Статус</th><th>Сума</th><th>Дата</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($__orders as $__o): ?>
              <tr>
                <td>№<?= e($__o['order_number']) ?></td>
                <td><?= e($__o['guest_name']) ?></td>
                <td>
                  <?php if ((int)$__o['is_legacy'] === 1): ?>
                    <span class="pill pill--info">🕐 Стар</span>
                  <?php else: ?>
                    <span class="pill pill--ok">✨ Нов</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if (is_repeat_in_index($__repeatIndex, $__o['guest_email'], $__o['guest_phone'])): ?>
                    <span class="pill pill--info">🔁 Повторен</span>
                  <?php else: ?>
                    <span class="muted">—</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if (!empty($__o['customer_password_hash'])): ?>
                    <span class="pill pill--ok">Регистриран</span>
                  <?php else: ?>
                    <span class="pill pill--muted">Гост</span>
                  <?php endif; ?>
                </td>
                <td><span class="pill pill--ok"><?= e($__o['status']) ?></span></td>
                <td><?= format_eur($__o['total_eur']) ?></td>
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
