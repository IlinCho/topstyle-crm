<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/customer_auth.php';

$__customer = get_current_customer();
if (!$__customer) {
    redirect_to('/account/login.php');
}

$__saved = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $city = trim($_POST['city'] ?? '');
    db_query(
        'UPDATE customer SET name = ?, phone = ?, address = ?, city = ? WHERE id = ?',
        [$name, $phone, $address, $city, $__customer['id']]
    );
    $__customer = db_one('SELECT * FROM customer WHERE id = ?', [$__customer['id']]);
    $__saved = true;
}

$__orders = db_all('SELECT * FROM `order` WHERE customer_id = ? ORDER BY created_at DESC', [$__customer['id']]);

$pageTitle = 'Моят акаунт';
require __DIR__ . '/../includes/header.php';
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">Моят акаунт</h1>

  <?php if ($__saved): ?>
    <p class="scarcity-badge scarcity-badge--ok">Данните са запазени.</p>
  <?php endif; ?>

  <div class="card-box">
    <h3 style="margin-top:0;">Данни за контакт</h3>
    <form method="POST" action="/account/profile.php">
      <div class="form-grid">
        <div class="field">
          <label>Име</label>
          <input type="text" name="name" value="<?= e($__customer['name']) ?>">
        </div>
        <div class="field">
          <label>Имейл</label>
          <input type="email" value="<?= e($__customer['email']) ?>" disabled>
        </div>
        <div class="field">
          <label>Телефон</label>
          <input type="tel" name="phone" value="<?= e($__customer['phone']) ?>">
        </div>
        <div class="field">
          <label>Град</label>
          <input type="text" name="city" value="<?= e($__customer['city']) ?>">
        </div>
      </div>
      <div class="field">
        <label>Адрес</label>
        <input type="text" name="address" value="<?= e($__customer['address']) ?>">
      </div>
      <button type="submit" class="btn">Запази промените</button>
    </form>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Моите поръчки</h3>
    <?php if (!$__orders): ?>
      <p class="muted">Все още нямаш направени поръчки.</p>
    <?php else: ?>
      <table class="admin-table">
        <thead><tr><th>Номер</th><th>Дата</th><th>Статус</th><th>Сума</th></tr></thead>
        <tbody>
          <?php foreach ($__orders as $__o): ?>
            <tr>
              <td>№<?= e($__o['order_number']) ?></td>
              <td><?= e(date('d.m.Y', strtotime($__o['created_at']))) ?></td>
              <td><span class="pill pill--ok"><?= e($__o['status']) ?></span></td>
              <td><?= format_eur($__o['total_eur']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
