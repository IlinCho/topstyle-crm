<?php
$activeNav = 'abandoned';
$pageTitle = 'Изоставени поръчки';
require __DIR__ . '/../includes/admin-header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    db_query('DELETE FROM abandoned_checkout WHERE id = ?', [$_POST['delete_id']]);
    redirect_to('/admin/abandoned.php');
}

$__rows = db_all('SELECT * FROM abandoned_checkout ORDER BY updated_at DESC');

$__stepLabels = [1 => 'Лични данни', 2 => 'Доставка', 3 => 'Плащане'];
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Изоставени поръчки (<?= count($__rows) ?>)</h1>
</div>

<p class="muted" style="margin-top:-6px;margin-bottom:16px;font-size:13px;">
  Клиенти, започнали поръчка (въвели име/имейл/телефон), но не я довършили. Изчезват от този
  списък автоматично, щом завършат истинска поръчка — иначе остават тук, за да им звъннеш/пишеш.
</p>

<div class="card-box">
  <?php if (!$__rows): ?>
    <p class="muted">Все още няма изоставени поръчки.</p>
  <?php else: ?>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Последна активност</th>
          <th>Име</th>
          <th>Телефон</th>
          <th>Имейл</th>
          <th>Град</th>
          <th>Стъпка</th>
          <th>Продукти</th>
          <th>Сума</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($__rows as $__r): $__items = json_decode($__r['items_json'] ?? '[]', true) ?: []; ?>
          <tr>
            <td class="muted" style="white-space:nowrap;"><?= e(date('d.m.Y H:i', strtotime($__r['updated_at']))) ?></td>
            <td><?= e($__r['name'] ?: '—') ?></td>
            <td><?= e($__r['phone'] ?: '—') ?></td>
            <td><?= e($__r['email'] ?: '—') ?></td>
            <td><?= e($__r['city'] ?: '—') ?></td>
            <td><span class="pill pill--warn"><?= e($__stepLabels[(int)$__r['step']] ?? ('Стъпка ' . (int)$__r['step'])) ?></span></td>
            <td style="font-size:12.5px;">
              <?php if (!$__items): ?>
                —
              <?php else: ?>
                <?php foreach ($__items as $__it): ?>
                  <div><?= e($__it['name'] ?? '') ?> (<?= e($__it['size'] ?? '') ?>) × <?= (int)($__it['qty'] ?? 0) ?></div>
                <?php endforeach; ?>
              <?php endif; ?>
            </td>
            <td><?= $__r['total_bgn'] ? format_bgn((float)$__r['total_bgn']) : '—' ?></td>
            <td>
              <form method="POST" action="/admin/abandoned.php" onsubmit="return confirm('Изтриване?');" style="display:inline;">
                <input type="hidden" name="delete_id" value="<?= e($__r['id']) ?>">
                <button type="submit" class="btn btn--ghost btn--sm">✕</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
