<?php
$activeNav = 'stock_alerts';
$pageTitle = 'Известия за наличност';
require __DIR__ . '/../includes/admin-header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['mark_notified_id'])) {
        db_query('UPDATE stock_alert SET notified = 1 WHERE id = ?', [$_POST['mark_notified_id']]);
    } elseif (isset($_POST['delete_id'])) {
        db_query('DELETE FROM stock_alert WHERE id = ?', [$_POST['delete_id']]);
    }
    redirect_to('/admin/stock-alerts.php');
}

$__alerts = db_all(
    'SELECT sa.*, p.name AS product_name, p.slug AS product_slug,
            (SELECT stock FROM product_variant pv WHERE pv.product_id = sa.product_id AND pv.size = sa.size AND pv.color = sa.color) AS current_stock
     FROM stock_alert sa JOIN product p ON p.id = sa.product_id
     ORDER BY sa.notified ASC, sa.created_at DESC'
);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Известия за наличност</h1>
</div>

<div class="card-box">
  <?php if (!$__alerts): ?>
    <p class="muted">Все още няма заявки за известяване.</p>
  <?php else: ?>
    <table class="admin-table">
      <thead><tr><th>Продукт</th><th>Размер</th><th>Имейл</th><th>Текуща наличност</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($__alerts as $__a): ?>
          <tr>
            <td><a href="/product.php?slug=<?= urlencode($__a['product_slug']) ?>" target="_blank"><?= e($__a['product_name']) ?></a></td>
            <td><?= e($__a['size']) ?><?= $__a['color'] ? ' · ' . e($__a['color']) : '' ?></td>
            <td><?= e($__a['email']) ?></td>
            <td><?= $__a['current_stock'] !== null ? (int)$__a['current_stock'] : '—' ?></td>
            <td>
              <?php if ($__a['notified']): ?>
                <span class="pill pill--ok">известен</span>
              <?php else: ?>
                <span class="pill pill--warn">чака</span>
              <?php endif; ?>
            </td>
            <td><?= e(date('d.m.Y', strtotime($__a['created_at']))) ?></td>
            <td style="white-space:nowrap;">
              <?php if (!$__a['notified']): ?>
                <form method="POST" action="/admin/stock-alerts.php" style="display:inline;">
                  <input type="hidden" name="mark_notified_id" value="<?= e($__a['id']) ?>">
                  <button type="submit" class="btn btn--sm">Маркирай известен</button>
                </form>
              <?php endif; ?>
              <form method="POST" action="/admin/stock-alerts.php" onsubmit="return confirm('Изтриване?');" style="display:inline;">
                <input type="hidden" name="delete_id" value="<?= e($__a['id']) ?>">
                <button type="submit" class="btn btn--danger btn--sm">Изтрий</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
