<?php
$activeNav = 'abandoned';
$pageTitle = 'Изоставени поръчки';
require __DIR__ . '/../includes/admin-header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id']) && verify_csrf_token($_POST['csrf_token'] ?? '')) {
    db_query('DELETE FROM abandoned_checkout WHERE id = ?', [$_POST['delete_id']]);
    redirect_to('/admin/abandoned.php');
}

$__rows = db_all('SELECT * FROM abandoned_checkout ORDER BY updated_at DESC');
$__stepLabels = [1 => 'Лични данни', 2 => 'Доставка', 3 => 'Плащане'];
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Изоставени поръчки</h1>
</div>

<?php if (!$__rows): ?>
  <p class="muted">Все още няма изоставени поръчки.</p>
<?php else: ?>
  <div class="card-box" style="padding:0;">
    <table class="admin-table">
      <thead>
        <tr>
          <th>Последна активност</th>
          <th>Име</th>
          <th>Телефон</th>
          <th>Имейл</th>
          <th>Град</th>
          <th>Стъпка</th>
          <th>Артикули</th>
          <th>Общо</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($__rows as $__r): $__items = json_decode($__r['items_json'] ?? '[]', true) ?: []; ?>
          <tr>
            <td style="white-space:nowrap;"><?= e(date('d.m.Y H:i', strtotime($__r['updated_at']))) ?></td>
            <td><?= $__r['name'] !== '' ? e($__r['name']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__r['phone'] !== '' ? e($__r['phone']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__r['email'] !== '' ? e($__r['email']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__r['city'] !== '' ? e($__r['city']) : '<span class="muted">—</span>' ?></td>
            <td><span class="pill pill--info"><?= e($__stepLabels[(int)$__r['step']] ?? $__r['step']) ?></span></td>
            <td style="font-size:12.5px;">
              <?php if (!$__items): ?>
                <span class="muted">празна количка</span>
              <?php else: ?>
                <?php foreach ($__items as $__it): ?>
                  <div><?= e($__it['name'] ?? '') ?> · <?= e($__it['size'] ?? '') ?> · × <?= (int)($__it['qty'] ?? 0) ?></div>
                <?php endforeach; ?>
              <?php endif; ?>
            </td>
            <td style="font-weight:700;"><?= format_eur($__r['total_bgn'] / 1.95583) ?></td>
            <td>
              <form method="POST" action="/admin/abandoned.php">
                <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="delete_id" value="<?= e($__r['id']) ?>">
                <button class="btn btn--ghost btn--sm" type="submit">Изтрий</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
