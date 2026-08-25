<?php
// Two very different "customer" tables live in this system: `customer` is
// everyone who has actually placed an order or registered on the NEW site
// (created even for guest checkouts), while `legacy_customer` is the raw
// reference list imported from the old PrestaShop store (email/phone/name
// only, used purely for lookup at order time). This page lets the admin
// browse+search both, as two tabs, instead of only ever seeing a bare count
// on the "Стари клиенти" import page.
$activeNav = 'customers';
$pageTitle = 'Клиенти';
require __DIR__ . '/../includes/admin-header.php';

const PAGE_SIZE = 50;

function build_href(array $params): string {
    $qs = http_build_query(array_filter($params, fn($v) => $v !== '' && $v !== null));
    return '/admin/customers.php' . ($qs ? '?' . $qs : '');
}

$__tab = ($_GET['tab'] ?? '') === 'legacy' ? 'legacy' : 'registered';
$__q = trim((string)($_GET['q'] ?? ''));
$__page = max(1, (int)($_GET['page'] ?? 1));
$__skip = ($__page - 1) * PAGE_SIZE;

$__registeredTotal = (int)(db_one('SELECT COUNT(*) AS c FROM customer')['c'] ?? 0);
$__legacyTotal = (int)(db_one('SELECT COUNT(*) AS c FROM legacy_customer')['c'] ?? 0);

$__qDigits = preg_replace('/\D/', '', $__q);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Клиенти</h1>
</div>

<div style="display:flex;gap:8px;margin-bottom:14px;">
  <a href="<?= e(build_href(['tab' => 'registered'])) ?>" class="btn btn--sm <?= $__tab === 'registered' ? '' : 'btn--ghost' ?>">
    Клиенти на новия сайт (<?= $__registeredTotal ?>)
  </a>
  <a href="<?= e(build_href(['tab' => 'legacy'])) ?>" class="btn btn--sm <?= $__tab === 'legacy' ? '' : 'btn--ghost' ?>">
    Стари клиенти — импорт (<?= $__legacyTotal ?>)
  </a>
</div>

<?php if ($__tab === 'legacy'): ?>

  <p class="muted" style="font-size:13px;margin-top:-6px;margin-bottom:14px;">
    Справочен списък, импортиран от стария магазин — виж <a href="/admin/legacy-customers.php">Стари клиенти</a>
    за добавяне на нови редове или преизчисляване на поръчки.
  </p>

  <form class="card-box" style="display:flex;gap:12px;" method="GET" action="/admin/customers.php">
    <input type="hidden" name="tab" value="legacy">
    <input name="q" placeholder="Търси по име, имейл или телефон..." value="<?= e($__q) ?>" style="flex:1;padding:9px;border:1px solid #d7d7d7;border-radius:4px;">
    <button class="btn btn--sm" type="submit">Търси</button>
    <?php if ($__q): ?><a href="<?= e(build_href(['tab' => 'legacy'])) ?>" class="btn btn--ghost btn--sm">Изчисти</a><?php endif; ?>
  </form>

  <?php
  $__where = '';
  $__params = [];
  if ($__q !== '') {
      $__where = 'WHERE (name LIKE ? OR email LIKE ?' . ($__qDigits !== '' ? ' OR phone LIKE ?' : '') . ')';
      $__params[] = '%' . $__q . '%';
      $__params[] = '%' . strtolower($__q) . '%';
      if ($__qDigits !== '') $__params[] = '%' . $__qDigits . '%';
  }
  $__total = (int)(db_one("SELECT COUNT(*) AS c FROM legacy_customer $__where", $__params)['c'] ?? 0);
  $__totalPages = max(1, (int)ceil($__total / PAGE_SIZE));
  $__rows = db_all("SELECT * FROM legacy_customer $__where ORDER BY created_at DESC LIMIT " . PAGE_SIZE . " OFFSET $__skip", $__params);
  ?>
  <div class="card-box">
    <table class="admin-table">
      <thead><tr><th>Име</th><th>Имейл</th><th>Телефон</th><th>Добавен на</th></tr></thead>
      <tbody>
        <?php foreach ($__rows as $__c): ?>
          <tr>
            <td><?= $__c['name'] ? e($__c['name']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__c['email'] ? e($__c['email']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__c['phone'] ? e($__c['phone']) : '<span class="muted">—</span>' ?></td>
            <td class="muted"><?= e(date('d.m.Y, H:i', strtotime($__c['created_at']))) ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$__rows): ?>
          <tr><td colspan="4" class="muted"><?= $__q ? 'Няма съвпадения.' : 'Списъкът е празен.' ?></td></tr>
        <?php endif; ?>
      </tbody>
    </table>
    <?php if ($__totalPages > 1): ?>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <a href="<?= e(build_href(['tab' => 'legacy', 'q' => $__q, 'page' => (string)max(1, $__page - 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page <= 1 ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>← Предишна</a>
        <span class="muted" style="align-self:center;font-size:13px;">Страница <?= $__page ?> от <?= $__totalPages ?></span>
        <a href="<?= e(build_href(['tab' => 'legacy', 'q' => $__q, 'page' => (string)min($__totalPages, $__page + 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page >= $__totalPages ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>Следваща →</a>
      </div>
    <?php endif; ?>
  </div>

<?php else: ?>

  <form class="card-box" style="display:flex;gap:12px;" method="GET" action="/admin/customers.php">
    <input type="hidden" name="tab" value="registered">
    <input name="q" placeholder="Търси по име, имейл или телефон..." value="<?= e($__q) ?>" style="flex:1;padding:9px;border:1px solid #d7d7d7;border-radius:4px;">
    <button class="btn btn--sm" type="submit">Търси</button>
    <?php if ($__q): ?><a href="<?= e(build_href(['tab' => 'registered'])) ?>" class="btn btn--ghost btn--sm">Изчисти</a><?php endif; ?>
  </form>

  <?php
  $__where = '';
  $__params = [];
  if ($__q !== '') {
      $__where = 'WHERE (name LIKE ? OR email LIKE ?' . ($__qDigits !== '' ? ' OR phone LIKE ?' : '') . ')';
      $__params[] = '%' . $__q . '%';
      $__params[] = '%' . strtolower($__q) . '%';
      if ($__qDigits !== '') $__params[] = '%' . $__qDigits . '%';
  }
  $__total = (int)(db_one("SELECT COUNT(*) AS c FROM customer $__where", $__params)['c'] ?? 0);
  $__totalPages = max(1, (int)ceil($__total / PAGE_SIZE));
  $__rows = db_all("SELECT * FROM customer $__where ORDER BY created_at DESC LIMIT " . PAGE_SIZE . " OFFSET $__skip", $__params);

  $__ids = array_column($__rows, 'id');
  $__orderStats = [];
  if ($__ids) {
      $__placeholders = implode(',', array_fill(0, count($__ids), '?'));
      $__statRows = db_all(
          "SELECT customer_id, COUNT(*) AS cnt, COALESCE(SUM(total_eur),0) AS total FROM `order` WHERE customer_id IN ($__placeholders) GROUP BY customer_id",
          $__ids
      );
      foreach ($__statRows as $__s) {
          $__orderStats[$__s['customer_id']] = $__s;
      }
  }

  $__legacyEmailSet = [];
  $__legacyPhoneSet = [];
  $__emails = array_values(array_filter(array_map(fn($c) => normalize_email($c['email'] ?? ''), $__rows)));
  $__phones = array_values(array_filter(array_map(fn($c) => normalize_phone($c['phone'] ?? ''), $__rows)));
  if ($__emails || $__phones) {
      $__conds = [];
      $__lp = [];
      if ($__emails) {
          $__conds[] = 'email IN (' . implode(',', array_fill(0, count($__emails), '?')) . ')';
          $__lp = array_merge($__lp, $__emails);
      }
      if ($__phones) {
          $__conds[] = 'phone IN (' . implode(',', array_fill(0, count($__phones), '?')) . ')';
          $__lp = array_merge($__lp, $__phones);
      }
      $__legacyRows = db_all('SELECT email, phone FROM legacy_customer WHERE ' . implode(' OR ', $__conds), $__lp);
      foreach ($__legacyRows as $__lr) {
          if ($__lr['email']) $__legacyEmailSet[$__lr['email']] = true;
          if ($__lr['phone']) $__legacyPhoneSet[$__lr['phone']] = true;
      }
  }
  ?>
  <div class="card-box">
    <table class="admin-table">
      <thead>
        <tr>
          <th>Име</th><th>Имейл</th><th>Телефон</th><th>Град</th><th>Тип</th><th>Стар клиент</th><th>Поръчки</th><th>Общо похарчено</th><th>Регистриран на</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($__rows as $__c):
          $__isLegacy = isset($__legacyEmailSet[normalize_email($__c['email'] ?? '')]) || isset($__legacyPhoneSet[normalize_phone($__c['phone'] ?? '')]);
          $__stats = $__orderStats[$__c['id']] ?? ['cnt' => 0, 'total' => 0];
        ?>
          <tr>
            <td><?= $__c['name'] ? e($__c['name']) : '<span class="muted">—</span>' ?></td>
            <td><?= e($__c['email']) ?></td>
            <td><?= $__c['phone'] ? e($__c['phone']) : '<span class="muted">—</span>' ?></td>
            <td><?= $__c['city'] ? e($__c['city']) : '<span class="muted">—</span>' ?></td>
            <td><?= !empty($__c['password_hash']) ? '<span class="pill pill--ok">Регистриран</span>' : '<span class="pill pill--muted">Гост</span>' ?></td>
            <td><?= $__isLegacy ? '<span class="pill pill--info">🕐 Стар</span>' : '<span class="muted">—</span>' ?></td>
            <td><?= (int)$__stats['cnt'] ?></td>
            <td><?= format_eur($__stats['total']) ?></td>
            <td class="muted"><?= e(date('d.m.Y, H:i', strtotime($__c['created_at']))) ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$__rows): ?>
          <tr><td colspan="9" class="muted"><?= $__q ? 'Няма съвпадения.' : 'Все още няма клиенти.' ?></td></tr>
        <?php endif; ?>
      </tbody>
    </table>
    <?php if ($__totalPages > 1): ?>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <a href="<?= e(build_href(['tab' => 'registered', 'q' => $__q, 'page' => (string)max(1, $__page - 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page <= 1 ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>← Предишна</a>
        <span class="muted" style="align-self:center;font-size:13px;">Страница <?= $__page ?> от <?= $__totalPages ?></span>
        <a href="<?= e(build_href(['tab' => 'registered', 'q' => $__q, 'page' => (string)min($__totalPages, $__page + 1)])) ?>" class="btn btn--ghost btn--sm" <?= $__page >= $__totalPages ? 'style="pointer-events:none;opacity:.4;"' : '' ?>>Следваща →</a>
      </div>
    <?php endif; ?>
  </div>

<?php endif; ?>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
