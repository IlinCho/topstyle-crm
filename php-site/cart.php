<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/cart.php';
require_once __DIR__ . '/includes/scarcity.php';

cart_start();

// Single form covers both "update quantities" and "remove one line" (via a
// per-row submit button) - no nested <form> tags, and the hidden field is
// deliberately NOT named "action" to avoid it shadowing form.action in JS.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['remove_key'])) {
        cart_remove($_POST['remove_key']);
    } elseif (isset($_POST['update_all'])) {
        foreach ($_POST['qty'] ?? [] as $__key => $__qty) {
            cart_update_qty($__key, (int)$__qty);
        }
    }
    redirect_to('/cart.php');
}

$pageTitle = 'Количка';
require __DIR__ . '/includes/header.php';

$__lines = cart_line_items();
$__totals = cart_totals($__lines);
$__hasOutOfStock = false;
foreach ($__lines as $__l) {
    if ($__l['qty'] > $__l['stock']) $__hasOutOfStock = true;
}
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">Количка</h1>

  <?php if (!$__lines): ?>
    <p class="muted">Количката е празна. <a href="/index.php">Разгледай продуктите</a>.</p>
  <?php else: ?>
    <form method="POST" action="/cart.php">
      <?php foreach ($__lines as $__l): ?>
        <div class="cart-row">
          <img src="<?= e($__l['image_url'] ?: '/assets/placeholder.jpg') ?>" alt="<?= e($__l['product']['name']) ?>">
          <div>
            <p style="margin:0;"><?= e($__l['product']['name']) ?></p>
            <p class="muted" style="margin:4px 0;">
              Размер: <?= e($__l['size']) ?><?= $__l['color'] ? ' · ' . e($__l['color']) : '' ?>
            </p>
            <?= render_scarcity_badge($__l['stock']) ?>
            <?php if ($__l['qty'] > $__l['stock']): ?>
              <p class="error-text">⛔ Този размер вече е изчерпан в поръчаното количество — намали бройката или премахни артикула.</p>
            <?php endif; ?>
            <label class="muted" style="font-size:12px;">
              Брой: <input type="number" name="qty[<?= e($__l['key']) ?>]" value="<?= (int)$__l['qty'] ?>" min="0" style="width:60px;">
            </label>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 8px;font-weight:700;"><?= format_bgn($__l['product']['price_bgn'] * $__l['qty']) ?></p>
            <button type="submit" name="remove_key" value="<?= e($__l['key']) ?>" class="btn btn--ghost btn--sm">Премахни</button>
          </div>
        </div>
      <?php endforeach; ?>
      <div style="margin-top:16px;">
        <button type="submit" name="update_all" value="1" class="btn btn--ghost">Обнови количествата</button>
      </div>
    </form>

    <div class="cart-totals">
      <table>
        <tr><td>Междинна сума</td><td><?= format_bgn($__totals['bgn']) ?></td></tr>
        <tr><td>Общо</td><td><?= format_bgn($__totals['bgn']) ?> / <?= format_eur($__totals['eur']) ?></td></tr>
      </table>
    </div>

    <ul class="trust-strip">
      <li><span class="trust-strip__check">&#10003;</span> Преглед и тест</li>
      <li><span class="trust-strip__check">&#10003;</span> Лесна замяна</li>
      <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
      <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
    </ul>

    <?php if ($__hasOutOfStock): ?>
      <p class="error-text">Моля, коригирай количките по-горе, преди да продължиш към поръчката.</p>
    <?php else: ?>
      <a href="/checkout.php" class="btn">Продължи към поръчката</a>
    <?php endif; ?>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
