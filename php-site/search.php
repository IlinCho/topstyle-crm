<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$__q = trim($_GET['q'] ?? '');
$pageTitle = $__q !== '' ? 'Резултати за "' . $__q . '"' : 'Търсене';
require __DIR__ . '/includes/header.php';

$__products = [];
if ($__q !== '') {
    $__like = '%' . $__q . '%';
    $__products = db_all(
        'SELECT * FROM product WHERE active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY created_at DESC',
        [$__like, $__like]
    );
}
?>
<div class="container">
  <h1 class="section-title" style="margin-top:24px;">
    <?= $__q !== '' ? 'Резултати за "' . e($__q) . '"' : 'Търсене' ?>
    <span class="muted" style="font-weight:400;font-size:14px;">(<?= count($__products) ?> продукта)</span>
  </h1>

  <?php if ($__q === ''): ?>
    <p class="muted">Въведете дума за търсене.</p>
  <?php elseif (!$__products): ?>
    <p class="muted">Няма намерени продукти.</p>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($__products as $__p): ?>
        <?php include __DIR__ . '/includes/product-card.php'; ?>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
