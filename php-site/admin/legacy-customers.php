<?php
$activeNav = 'legacy_customers';
$pageTitle = 'Стари клиенти';
require __DIR__ . '/../includes/admin-header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['import_csv'])) {
        $raw = (string)($_POST['legacy_csv'] ?? '');
        $lines = array_values(array_filter(array_map('trim', explode("\n", $raw)), fn($l) => $l !== ''));
        foreach ($lines as $line) {
            $parts = explode(',', $line);
            $emailRaw = $parts[0] ?? '';
            $phoneRaw = $parts[1] ?? '';
            $name = trim(implode(',', array_slice($parts, 2)));
            $email = normalize_email($emailRaw);
            $phone = normalize_phone($phoneRaw);
            if ($email === '' && $phone === '') continue;
            db_query(
                'INSERT INTO legacy_customer (id, email, phone, name) VALUES (?, ?, ?, ?)',
                [db_id(), $email, $phone, $name]
            );
        }
        redirect_to('/admin/legacy-customers.php?imported=1');
    } elseif (isset($_POST['recalc'])) {
        $__orders = db_all('SELECT id, guest_email, guest_phone FROM `order` WHERE is_legacy = 0');
        foreach ($__orders as $__o) {
            if (check_is_legacy($__o['guest_email'], $__o['guest_phone'])) {
                db_query('UPDATE `order` SET is_legacy = 1 WHERE id = ?', [$__o['id']]);
            }
        }
        redirect_to('/admin/legacy-customers.php?recalced=1');
    } elseif (isset($_POST['delete_all'])) {
        db_query('DELETE FROM legacy_customer', []);
        redirect_to('/admin/legacy-customers.php?deleted=1');
    }
}

$__count = (int)(db_one('SELECT COUNT(*) AS c FROM legacy_customer')['c'] ?? 0);
$__legacyOrderCount = (int)(db_one('SELECT COUNT(*) AS c FROM `order` WHERE is_legacy = 1')['c'] ?? 0);
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Стари клиенти</h1>
</div>

<?php if (isset($_GET['imported'])): ?>
  <div class="card-box" style="background:#e7f6ec;border-color:#bfe6cb;">Списъкът е обновен.</div>
<?php endif; ?>
<?php if (isset($_GET['recalced'])): ?>
  <div class="card-box" style="background:#e7f6ec;border-color:#bfe6cb;">Поръчките са преизчислени.</div>
<?php endif; ?>
<?php if (isset($_GET['deleted'])): ?>
  <div class="card-box" style="background:#e7f6ec;border-color:#bfe6cb;">Списъкът е изтрит.</div>
<?php endif; ?>

<div class="card-box">
  <p style="margin-top:0;">
    Списък с клиенти, които вече са пазарували от стария магазин (PrestaShop), преди този сайт.
    При всяка нова поръчка имейлът/телефонът на клиента се сравнява с този списък — ако съвпадне,
    поръчката се маркира като <strong>„Стар клиент"</strong> в Поръчки, иначе е <strong>„Нов клиент"</strong>.
  </p>
  <p class="muted" style="font-size:13px;">
    В момента в списъка има <strong><?= $__count ?></strong> стари клиента. Общо <strong><?= $__legacyOrderCount ?></strong>
    поръчки в системата в момента са маркирани като от стари клиенти.
  </p>
</div>

<div class="card-box">
  <h3 style="margin-top:0;">Добави стари клиенти (CSV)</h3>
  <p class="muted" style="font-size:12.5px;margin-top:-6px;margin-bottom:10px;">
    Как да вземеш списъка: в стария PrestaShop админ панел отиди на Customers (Клиенти) → Export,
    или помоли хостинг доставчика за SQL export на таблицата <code>ps_customer</code>. После постави
    редовете тук — по един клиент на ред, стойностите разделени със запетая: <strong>имейл, телефон, име</strong>.
    Телефонът и името са по избор, но поне едно от имейл/телефон трябва да е попълнено на всеки ред.
  </p>
  <form method="POST" action="/admin/legacy-customers.php">
    <input type="hidden" name="import_csv" value="1">
    <div class="field">
      <textarea name="legacy_csv" rows="10" placeholder="ivan@example.com, 0888123456, Иван Иванов&#10;maria@example.com, , Мария Петрова&#10;, 0899112233, Георги Georgiev"></textarea>
    </div>
    <button type="submit" class="btn btn--sm">Импортирай</button>
  </form>
</div>

<div class="card-box">
  <h3 style="margin-top:0;">Преизчисли съществуващи поръчки</h3>
  <p class="muted" style="font-size:12.5px;margin-top:-6px;margin-bottom:10px;">
    Поръчки, направени преди да добавиш даден стар клиент в списъка по-горе, не се преоценяват
    автоматично. Натисни бутона, за да провериш всички досегашни поръчки още веднъж спрямо
    текущия списък и да отбележиш съвпаденията като „Стар клиент".
  </p>
  <form method="POST" action="/admin/legacy-customers.php">
    <input type="hidden" name="recalc" value="1">
    <button type="submit" class="btn btn--ghost btn--sm">Преизчисли поръчките</button>
  </form>
</div>

<?php if ($__count > 0): ?>
<div class="card-box">
  <h3 style="margin-top:0;">Изчисти списъка</h3>
  <p class="muted" style="font-size:12.5px;margin-top:-6px;margin-bottom:10px;">
    Изтрива целия списък със стари клиенти (не пипа поръчки или клиенти — само справочния списък по-горе).
  </p>
  <form method="POST" action="/admin/legacy-customers.php">
    <input type="hidden" name="delete_all" value="1">
    <button type="submit" class="btn btn--danger btn--sm">Изтрий целия списък</button>
  </form>
</div>
<?php endif; ?>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
