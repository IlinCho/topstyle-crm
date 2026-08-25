<?php
$activeNav = 'products';
$pageTitle = 'Продукти';
require __DIR__ . '/../includes/admin-header.php';

const PAGE_SIZE = 100;

function build_products_href(array $params): string {
    $qs = http_build_query(array_filter($params, fn($v) => $v !== '' && $v !== null));
    return '/admin/products.php' . ($qs ? '?' . $qs : '');
}

$__error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    try {
        db_query('DELETE FROM product WHERE id = ?', [$_POST['delete_id']]);
    } catch (PDOException $e) {
        $__error = 'Продуктът не може да бъде изтрит — вероятно е част от съществуваща поръчка.';
    }
    if ($__error === '') redirect_to('/admin/products.php');
}

$__categories = db_all('SELECT * FROM category ORDER BY position ASC');

$__q = trim((string)($_GET['q'] ?? ''));
$__categoryId = (string)($_GET['category'] ?? '');
$__page = max(1, (int)($_GET['page'] ?? 1));
$__skip = ($__page - 1) * PAGE_SIZE;

$__whereParts = [];
$__params = [];
if ($__q !== '') {
    $__whereParts[] = '(p.name LIKE ? OR p.sku LIKE ?)';
    $__params[] = '%' . $__q . '%';
    $__params[] = '%' . $__q . '%';
}
if ($__categoryId !== '') {
    $__whereParts[] = 'p.category_id = ?';
    $__params[] = $__categoryId;
}
$__where = $__whereParts ? ('WHERE ' . implode(' AND ', $__whereParts)) : '';

$__total = (int)(db_one("SELECT COUNT(*) AS c FROM product p $__where", $__params)['c'] ?? 0);
$__totalPages = max(1, (int)ceil($__total / PAGE_SIZE));

$__products = db_all(
    "SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON c.id = p.category_id $__where ORDER BY p.created_at DESC LIMIT " . PAGE_SIZE . " OFFSET $__skip",
    $__params
);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Продукти (<?= $__total ?>)</h1>
  <a href="/admin/product-form.php" class="btn">+ Нов продукт</a>
</div>
<?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>

<form class="card-box" style="display:flex;gap:12px;" method="GET" action="/admin/products.php">
  <input name="q" placeholder="Търси по име или код (SKU)..." value="<?= e($__q) ?>" style="flex:1;padding:9px;border:1px solid #d7d7d7;border-radius:4px;">
  <select name="category" style="padding:9px;border:1px solid #d7d7d7;border-radius:4px;">
    <option value="">Всички категории</option>
    <?php foreach ($__categories as $__c): ?>
      <option value="<?= e($__c['id']) ?>" <?= $__categoryId === $__c['id'] ? 'selected' : '' ?>><?= e($__c['name']) ?></option>
    <?php endforeach; ?>
  </select>
  <button class="btn btn--sm" type="submit">Филтрирай</button>
  <?php if ($__q || $__categoryId): ?><a href="/admin/products.php" class="btn btn--ghost btn--sm">Изчисти</a><?php endif; ?>
</form>

<div class="card-box">
  <table class="admin-table">
    <thead><tr><th></th><th>SKU</th><th>Име</th><th>Категория</th><th>Цена</th><th>Позиция</th><th>Активен</th><th></th></tr></thead>
    <tbody>
      <?php foreach ($__products as $__p): $__img = db_one('SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1', [$__p['id']]); ?>
        <tr>
          <td><img src="<?= e($__img ? $__img['url'] : '/assets/placeholder.jpg') ?>" alt=""></td>
          <td class="muted"><?= e($__p['sku']) ?></td>
          <td><?= e($__p['name']) ?></td>
          <td class="muted"><?= e($__p['category_name'] ?? '—') ?></td>
          <td><?= format_eur($__p['price_eur']) ?></td>
          <td><?= $__p['category_rank'] !== null ? (int)$__p['category_rank'] : '—' ?></td>
          <td><?= $__p['active'] ? '<span class="pill pill--ok">да</span>' : '<span class="pill pill--warn">не</span>' ?></td>
          <td>
            <a href="/admin/product-form.php?id=<?= e($__p['id']) ?>" class="btn btn--ghost btn--sm">Редактирай</a>
            <form method="POST" action="/admin/products.php" onsubmit="return confirm('Изтриване на продукта?');" style="display:inline;">
              <input type="hidden" name="delete_id" value="<?= e($__p['id']) ?>">
              <button type="submit" class="btn btn--danger btn--sm">Изтрий</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$__products): ?>
        <tr><td colspan="8" class="muted">Няма намерени продукти.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>

  <?php if ($__totalPages > 1): ?>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
      <a href="<?= e(build_products_href(['q' => $__q, 'category' => $__categoryId, 'page' => (string)max(1, $__page - 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page <= 1 ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>← Предишна</a>
      <span class="muted" style="align-self:center;font-size:13px;">Страница <?= $__page ?> от <?= $__totalPages ?></span>
      <a href="<?= e(build_products_href(['q' => $__q, 'category' => $__categoryId, 'page' => (string)min($__totalPages, $__page + 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page >= $__totalPages ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>Следваща →</a>
    </div>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
