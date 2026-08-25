<?php
$activeNav = 'dashboard';
$pageTitle = 'Табло';
require __DIR__ . '/../includes/admin-header.php';

$__productCount = (int)(db_one('SELECT COUNT(*) AS c FROM product')['c'] ?? 0);
$__orderCount = (int)(db_one('SELECT COUNT(*) AS c FROM `order`')['c'] ?? 0);
$__customerCount = (int)(db_one("SELECT COUNT(*) AS c FROM customer WHERE password_hash != ''")['c'] ?? 0);
$__revenue = (float)(db_one('SELECT COALESCE(SUM(total_eur),0) AS s FROM `order`')['s'] ?? 0);
$__pendingAlerts = (int)(db_one('SELECT COUNT(*) AS c FROM stock_alert WHERE notified = 0')['c'] ?? 0);
$__recentOrders = db_all(
    'SELECT o.*, c.password_hash AS customer_password_hash FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 8'
);
$__repeatIndex = build_repeat_index();
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Табло</h1>
</div>

<div class="stat-grid">
  <div class="stat-box"><div class="stat-box__label">Продукти</div><div class="stat-box__value"><?= $__productCount ?></div></div>
  <div class="stat-box"><div class="stat-box__label">Поръчки</div><div class="stat-box__value"><?= $__orderCount ?></div></div>
  <div class="stat-box"><div class="stat-box__label">Регистрирани клиенти</div><div class="stat-box__value"><?= $__customerCount ?></div></div>
  <div class="stat-box"><div class="stat-box__label">Оборот (€)</div><div class="stat-box__value"><?= number_format($__revenue, 0) ?></div></div>
</div>

<?php if ($__pendingAlerts > 0): ?>
  <div class="card-box">
    <p><strong><?= $__pendingAlerts ?></strong> чакащи известия за наличност — <a href="/admin/stock-alerts.php">виж ги</a>.</p>
  </div>
<?php endif; ?>

<div class="card-box">
  <h3 style="margin-top:0;">Последни поръчки</h3>
  <?php if (!$__recentOrders): ?>
    <p class="muted">Все още няма поръчки.</p>
  <?php else: ?>
    <table class="admin-table">
      <thead><tr><th>Номер</th><th>Клиент</th><th>Статус клиент</th><th>Статус</th><th>Сума</th><th>Дата</th></tr></thead>
      <tbody>
        <?php foreach ($__recentOrders as $__o):
          $__custStatus = get_customer_status(
              (int)$__o['is_legacy'] === 1,
              is_repeat_in_index($__repeatIndex, $__o['guest_email'], $__o['guest_phone']),
              !empty($__o['customer_password_hash'])
          );
        ?>
          <tr>
            <td><a href="/admin/orders.php?id=<?= e($__o['id']) ?>">№<?= e($__o['order_number']) ?></a></td>
            <td><?= e($__o['guest_name']) ?></td>
            <td><span class="<?= e($__custStatus['pillClass']) ?>"><?= $__custStatus['icon'] . e($__custStatus['label']) ?></span></td>
            <td><span class="pill pill--ok"><?= e($__o['status']) ?></span></td>
            <td><?= format_eur($__o['total_eur']) ?></td>
            <td><?= e(date('d.m.Y', strtotime($__o['created_at']))) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
