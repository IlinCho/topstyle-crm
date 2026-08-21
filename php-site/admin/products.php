<?php
$activeNav = 'products';
$pageTitle = 'Продукти';
require __DIR__ . '/../includes/admin-header.php';

$__error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    try {
        db_query('DELETE FROM product WHERE id = ?', [$_POST['delete_id']]);
    } catch (PDOException $e) {
        $__error = 'Продуктът не може да бъде изтрит — вероятно е част от съществуваща поръчка.';
    }
    if ($__error === '') redirect_to('/admin/products.php');
}

$__products = db_all(
    'SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON c.id = p.category_id ORDER BY p.created_at DESC'
);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Продукти</h1>
  <a href="/admin/product-form.php" class="btn">+ Нов продукт</a>
</div>
<?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>

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
    </tbody>
  </table>
</div>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
