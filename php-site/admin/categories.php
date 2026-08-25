<?php
$activeNav = 'categories';
$pageTitle = 'Категории';
require __DIR__ . '/../includes/admin-header.php';

$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !verify_csrf_token($_POST['csrf_token'] ?? '')) {
    $__error = 'Невалидна сесия — презареди страницата и опитай отново.';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (isset($_POST['create'])) {
            $name = trim($_POST['name'] ?? '');
            $parentId = trim($_POST['parent_id'] ?? '') ?: null;
            $position = (int)($_POST['position'] ?? 0);
            if ($name === '') {
                $__error = 'Името е задължително.';
            } else {
                db_query(
                    'INSERT INTO category (id, slug, name, position, parent_id) VALUES (?, ?, ?, ?, ?)',
                    [db_id(), slugify_basic($name), $name, $position, $parentId]
                );
            }
        } elseif (isset($_POST['delete_id'])) {
            db_query('DELETE FROM category WHERE id = ?', [$_POST['delete_id']]);
        }
    } catch (PDOException $e) {
        // Most likely a foreign-key restriction (products or subcategories
        // still reference this category) - show a friendly message instead
        // of a raw 500 error.
        $__error = 'Не може да се изтрие/добави: категорията вероятно все още съдържа продукти или подкатегории.';
    }
    if ($__error === '') redirect_to('/admin/categories.php');
}

$__all = db_all('SELECT * FROM category ORDER BY position ASC, name ASC');
$__tree = build_category_tree($__all);
$__flat = flatten_category_tree($__tree);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Категории</h1>
</div>
<?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>

<div class="card-box">
  <h3 style="margin-top:0;">Нова категория</h3>
  <form method="POST" action="/admin/categories.php">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="create" value="1">
    <div class="form-grid">
      <div class="field">
        <label>Име</label>
        <input type="text" name="name" required>
      </div>
      <div class="field">
        <label>Родителска категория (по избор)</label>
        <select name="parent_id">
          <option value="">— Няма (основна категория) —</option>
          <?php foreach ($__flat as $__c): ?>
            <option value="<?= e($__c['id']) ?>"><?= str_repeat('— ', $__c['depth']) . e($__c['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="field">
        <label>Позиция</label>
        <input type="number" name="position" value="0">
      </div>
    </div>
    <button type="submit" class="btn">Добави категория</button>
  </form>
</div>

<div class="card-box">
  <table class="admin-table">
    <thead><tr><th>Име</th><th>Slug</th><th>Позиция</th><th></th></tr></thead>
    <tbody>
      <?php foreach ($__flat as $__c): ?>
        <tr>
          <td><?= str_repeat('— ', $__c['depth']) . e($__c['name']) ?></td>
          <td class="muted"><?= e($__c['slug']) ?></td>
          <td><?= (int)$__c['position'] ?></td>
          <td>
            <form method="POST" action="/admin/categories.php" onsubmit="return confirm('Изтриване на категорията?');" style="display:inline;">
              <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
              <input type="hidden" name="delete_id" value="<?= e($__c['id']) ?>">
              <button type="submit" class="btn btn--danger btn--sm">Изтрий</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
