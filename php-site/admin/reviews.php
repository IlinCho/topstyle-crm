<?php
$activeNav = 'reviews';
$pageTitle = 'Отзиви';
require __DIR__ . '/../includes/admin-header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    db_query('DELETE FROM review WHERE id = ?', [$_POST['delete_id']]);
    redirect_to('/admin/reviews.php');
}

$__reviews = db_all(
    'SELECT r.*, p.name AS product_name, p.slug AS product_slug
     FROM review r JOIN product p ON p.id = r.product_id
     ORDER BY r.created_at DESC'
);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Отзиви</h1>
</div>

<div class="card-box">
  <?php if (!$__reviews): ?>
    <p class="muted">Все още няма отзиви.</p>
  <?php else: ?>
    <table class="admin-table">
      <thead><tr><th>Продукт</th><th>Автор</th><th>Оценка</th><th>Коментар</th><th>Дата</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($__reviews as $__r): ?>
          <tr>
            <td><a href="/product.php?slug=<?= urlencode($__r['product_slug']) ?>" target="_blank"><?= e($__r['product_name']) ?></a></td>
            <td><?= e($__r['author_name']) ?></td>
            <td><?= (int)$__r['rating'] ?> / 5</td>
            <td style="max-width:280px;"><?= e($__r['comment']) ?></td>
            <td><?= e(date('d.m.Y', strtotime($__r['created_at']))) ?></td>
            <td>
              <form method="POST" action="/admin/reviews.php" onsubmit="return confirm('Изтриване на отзива?');" style="display:inline;">
                <input type="hidden" name="delete_id" value="<?= e($__r['id']) ?>">
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
