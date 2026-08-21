<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$__orderNumber = isset($_GET['order']) ? trim($_GET['order']) : '';
$__order = $__orderNumber !== '' ? db_one('SELECT * FROM `order` WHERE order_number = ?', [$__orderNumber]) : null;

$pageTitle = 'Поръчката е приета';
require __DIR__ . '/includes/header.php';

if (!$__order) {
    echo '<div class="container"><p class="muted" style="margin-top:24px;">Не намираме такава поръчка.</p></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$__items = db_all('SELECT * FROM order_item WHERE order_id = ?', [$__order['id']]);
?>
<div class="container">
  <div class="card-box" style="margin-top:24px;max-width:640px;">
    <h1 class="section-title" style="margin-top:0;">Благодарим ти, <?= e($__order['guest_name']) ?>!</h1>
    <p>Поръчка <strong>№<?= e($__order['order_number']) ?></strong> е приета успешно.</p>
    <p class="muted">Ще получиш потвърждение на <?= e($__order['guest_email']) ?>.</p>

    <table class="admin-table" style="margin-top:16px;">
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
    <p class="mt-24"><strong>Общо: <?= format_eur($__order['total_eur']) ?></strong></p>

    <ul class="trust-strip mt-24">
      <li><span class="trust-strip__check">&#10003;</span> Преглед и тест</li>
      <li><span class="trust-strip__check">&#10003;</span> Лесна замяна</li>
      <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
      <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
    </ul>

    <a href="/index.php" class="btn mt-24">Обратно към пазаруването</a>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
