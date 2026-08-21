<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/cart.php';
require_once __DIR__ . '/includes/customer_auth.php';
require_once __DIR__ . '/includes/scarcity.php';

cart_start();

if (cart_is_empty()) {
    redirect_to('/cart.php');
}

if (!isset($_SESSION['checkout']) || !is_array($_SESSION['checkout'])) {
    $_SESSION['checkout'] = ['max_step' => 1, 'personal' => [], 'delivery' => [], 'payment' => []];
}

$__customer = get_current_customer();
$__errors = [];

// ---- Handle each step's form submission. Every step is its own full page
// load (POST -> redirect -> GET), which is what gives us "scroll to top on
// step change" for free, without any client-side router. ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['form_action'])) {
    if ($_POST['form_action'] === 'save_step1') {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '') {
            $__errors[] = 'Моля, попълни име, валиден имейл и телефон.';
            $__step = 1;
        } else {
            $_SESSION['checkout']['personal'] = compact('name', 'email', 'phone');
            $_SESSION['checkout']['max_step'] = max($_SESSION['checkout']['max_step'], 2);
            save_abandoned_checkout_snapshot(
                $_SESSION['checkout']['personal'],
                $_SESSION['checkout']['delivery']['city'] ?? '',
                $_SESSION['checkout']['max_step']
            );
            redirect_to('/checkout.php?step=2');
        }
    } elseif ($_POST['form_action'] === 'save_step2') {
        $method = trim($_POST['delivery_method'] ?? '');
        $address = trim($_POST['address'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $office = trim($_POST['office_name'] ?? '');
        if (!in_array($method, ['courier', 'office'], true)) {
            $__errors[] = 'Избери начин на доставка.';
            $__step = 2;
        } elseif ($method === 'courier' && ($address === '' || $city === '')) {
            $__errors[] = 'Моля, въведи адрес и град за доставка с куриер до адрес.';
            $__step = 2;
        } elseif ($method === 'office' && $office === '') {
            $__errors[] = 'Моля, посочи офис на куриер.';
            $__step = 2;
        } else {
            $_SESSION['checkout']['delivery'] = compact('method', 'address', 'city', 'office');
            $_SESSION['checkout']['max_step'] = max($_SESSION['checkout']['max_step'], 3);
            save_abandoned_checkout_snapshot(
                $_SESSION['checkout']['personal'] ?? ['name' => '', 'email' => '', 'phone' => ''],
                $city,
                $_SESSION['checkout']['max_step']
            );
            redirect_to('/checkout.php?step=3');
        }
    } elseif ($_POST['form_action'] === 'save_step3') {
        $payment = trim($_POST['payment_method'] ?? '');
        if (!in_array($payment, ['cod', 'card'], true)) {
            $__errors[] = 'Избери начин на плащане.';
            $__step = 3;
        } else {
            $_SESSION['checkout']['payment'] = ['method' => $payment];
            $_SESSION['checkout']['max_step'] = max($_SESSION['checkout']['max_step'], 4);
            save_abandoned_checkout_snapshot(
                $_SESSION['checkout']['personal'] ?? ['name' => '', 'email' => '', 'phone' => ''],
                $_SESSION['checkout']['delivery']['city'] ?? '',
                3 // clamped to 3 by save_abandoned_checkout_snapshot() - step 4 is the real order itself
            );
            redirect_to('/checkout.php?step=4');
        }
    } elseif ($_POST['form_action'] === 'place_order') {
        $__lines = cart_line_items();
        $__blocked = false;
        foreach ($__lines as $__l) {
            if ($__l['qty'] > $__l['stock']) { $__blocked = true; break; }
        }
        if ($__blocked) {
            $__errors[] = 'Едно от количествата вече не е налично в поръчания брой. Провери количката.';
            $__step = 4;
        } else {
            $personal = $_SESSION['checkout']['personal'];
            $delivery = $_SESSION['checkout']['delivery'];
            $totals = cart_totals($__lines);
            $orderId = db_id();
            $orderNumber = strtoupper(substr($orderId, 0, 8));

            // Matched once, at creation time, against the admin-imported list
            // of old PrestaShop customers (Admin -> Стари клиенти).
            $__isLegacy = check_is_legacy($personal['email'], $personal['phone']) ? 1 : 0;

            db_query(
                'INSERT INTO `order`
                    (id, order_number, customer_id, guest_name, guest_email, guest_phone, address, city, delivery_method, office_name, status, is_legacy, total_bgn, total_eur)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $orderId, $orderNumber, $__customer ? $__customer['id'] : null,
                    $personal['name'], $personal['email'], $personal['phone'],
                    $delivery['address'], $delivery['city'], $delivery['method'], $delivery['office'],
                    'pending', $__isLegacy, $totals['bgn'], $totals['eur'],
                ]
            );

            foreach ($__lines as $__l) {
                db_query(
                    'INSERT INTO order_item (id, order_id, product_id, product_name, size, color, qty, price_bgn, price_eur)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        db_id(), $orderId, $__l['product']['id'], $__l['product']['name'],
                        $__l['size'], $__l['color'], $__l['qty'],
                        $__l['product']['price_bgn'], $__l['product']['price_eur'],
                    ]
                );
                db_query(
                    'UPDATE product_variant SET stock = GREATEST(stock - ?, 0) WHERE product_id = ? AND size = ? AND color = ?',
                    [$__l['qty'], $__l['product']['id'], $__l['size'], $__l['color']]
                );
            }

            delete_abandoned_checkout_snapshot();
            cart_clear();
            unset($_SESSION['checkout']);
            redirect_to('/order-confirmation.php?order=' . urlencode($orderNumber));
        }
    }
}

if (!isset($__step)) {
    $__step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
}
if ($__step < 1 || $__step > 4) $__step = 1;
// Never allow jumping ahead of what's actually been completed.
if ($__step > $_SESSION['checkout']['max_step']) $__step = $_SESSION['checkout']['max_step'];

$pageTitle = 'Поръчка';
require __DIR__ . '/includes/header.php';

$__lines = cart_line_items();
$__totals = cart_totals($__lines);
$__personal = !empty($_SESSION['checkout']['personal'])
    ? $_SESSION['checkout']['personal']
    : ($__customer ? ['name' => $__customer['name'], 'email' => $__customer['email'], 'phone' => $__customer['phone']] : ['name' => '', 'email' => '', 'phone' => '']);
$__delivery = !empty($_SESSION['checkout']['delivery']) ? $_SESSION['checkout']['delivery'] : ['method' => '', 'address' => '', 'city' => '', 'office' => ''];
$__payment = !empty($_SESSION['checkout']['payment']) ? $_SESSION['checkout']['payment'] : ['method' => ''];
$__maxStep = $_SESSION['checkout']['max_step'];
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">Поръчка</h1>

  <?php require __DIR__ . '/includes/checkout-progress.php'; ?>

  <?php foreach ($__errors as $__err): ?>
    <p class="error-text"><?= e($__err) ?></p>
  <?php endforeach; ?>

  <div class="pdp" style="align-items:flex-start;">
    <div>
      <?php if ($__step === 1): ?>
        <div class="card-box">
          <h2 style="margin-top:0;">Лични данни</h2>
          <form method="POST" action="/checkout.php">
            <input type="hidden" name="form_action" value="save_step1">
            <div class="field">
              <label>Име</label>
              <input type="text" name="name" value="<?= e($__personal['name']) ?>" required>
            </div>
            <div class="field">
              <label>Имейл</label>
              <input type="email" name="email" value="<?= e($__personal['email']) ?>" required>
            </div>
            <div class="field">
              <label>Телефон</label>
              <input type="tel" name="phone" value="<?= e($__personal['phone']) ?>" required>
            </div>
            <button type="submit" class="btn">Продължи към доставка</button>
          </form>
        </div>

      <?php elseif ($__step === 2): ?>
        <div class="card-box">
          <h2 style="margin-top:0;">Доставка</h2>
          <form method="POST" action="/checkout.php" id="delivery-form">
            <input type="hidden" name="form_action" value="save_step2">
            <div class="delivery-cards">
              <label class="delivery-card<?= $__delivery['method'] === 'courier' ? ' delivery-card--selected' : '' ?>">
                <input type="radio" name="delivery_method" value="courier" style="display:none;" <?= $__delivery['method'] === 'courier' ? 'checked' : '' ?> onchange="tsPickDelivery(this)">
                <div class="delivery-card__title">Доставка до адрес</div>
                <div class="delivery-card__subtitle">Куриер до твоя адрес, до 24 часа</div>
              </label>
              <label class="delivery-card<?= $__delivery['method'] === 'office' ? ' delivery-card--selected' : '' ?>">
                <input type="radio" name="delivery_method" value="office" style="display:none;" <?= $__delivery['method'] === 'office' ? 'checked' : '' ?> onchange="tsPickDelivery(this)">
                <div class="delivery-card__title">Доставка до офис</div>
                <div class="delivery-card__subtitle">Взимане от офис на куриер</div>
              </label>
            </div>

            <div id="address-fields" style="margin-top:16px;<?= $__delivery['method'] === 'office' ? 'display:none;' : '' ?>">
              <div class="field">
                <label>Адрес</label>
                <input type="text" name="address" value="<?= e($__delivery['address']) ?>">
              </div>
              <div class="field">
                <label>Град</label>
                <input type="text" name="city" value="<?= e($__delivery['city']) ?>">
              </div>
            </div>
            <div id="office-fields" style="margin-top:16px;<?= $__delivery['method'] === 'office' ? '' : 'display:none;' ?>">
              <div class="field">
                <label>Офис на куриер</label>
                <input type="text" name="office_name" value="<?= e($__delivery['office']) ?>" placeholder="напр. Спиди – офис Център">
              </div>
            </div>

            <button type="submit" class="btn">Продължи към плащане</button>
          </form>
        </div>

      <?php elseif ($__step === 3): ?>
        <div class="card-box">
          <h2 style="margin-top:0;">Плащане</h2>
          <form method="POST" action="/checkout.php">
            <input type="hidden" name="form_action" value="save_step3">
            <div class="delivery-cards">
              <label class="delivery-card<?= $__payment['method'] === 'cod' ? ' delivery-card--selected' : '' ?>">
                <input type="radio" name="payment_method" value="cod" style="display:none;" <?= $__payment['method'] === 'cod' ? 'checked' : '' ?> onchange="tsPickPayment(this)">
                <div class="delivery-card__title">Наложен платеж</div>
                <div class="delivery-card__subtitle">Плащаш в брой при получаване</div>
              </label>
              <label class="delivery-card<?= $__payment['method'] === 'card' ? ' delivery-card--selected' : '' ?>">
                <input type="radio" name="payment_method" value="card" style="display:none;" <?= $__payment['method'] === 'card' ? 'checked' : '' ?> onchange="tsPickPayment(this)">
                <div class="delivery-card__title">Карта при доставка</div>
                <div class="delivery-card__subtitle">Плащане с ПОС терминал на куриера</div>
              </label>
            </div>
            <button type="submit" class="btn mt-24">Продължи към потвърждение</button>
          </form>
        </div>

      <?php else: ?>
        <div class="card-box">
          <h2 style="margin-top:0;">Потвърждение на поръчката</h2>
          <p><strong>Лични данни:</strong> <?= e($__personal['name']) ?>, <?= e($__personal['email']) ?>, <?= e($__personal['phone']) ?></p>
          <p><strong>Доставка:</strong>
            <?php if ($__delivery['method'] === 'office'): ?>
              Офис на куриер — <?= e($__delivery['office']) ?>
            <?php else: ?>
              Адрес — <?= e($__delivery['address']) ?>, <?= e($__delivery['city']) ?>
            <?php endif; ?>
          </p>
          <p><strong>Плащане:</strong> <?= $__payment['method'] === 'card' ? 'Карта при доставка' : 'Наложен платеж' ?></p>

          <?php
          $__hasCritical = false;
          foreach ($__lines as $__l) {
              if (is_critical_stock($__l['stock'])) { $__hasCritical = true; break; }
          }
          ?>
          <?php if ($__hasCritical): ?>
            <p class="error-text">⚠ Един или повече артикула в количката ти са на привършване — поръчай сега, за да запазиш размера си.</p>
          <?php endif; ?>

          <form method="POST" action="/checkout.php">
            <input type="hidden" name="form_action" value="place_order">
            <button type="submit" class="btn">Потвърди поръчката</button>
          </form>

          <ul class="trust-strip mt-24">
            <li><span class="trust-strip__check">&#10003;</span> Преглед и тест</li>
            <li><span class="trust-strip__check">&#10003;</span> Лесна замяна</li>
            <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
            <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
          </ul>
        </div>
      <?php endif; ?>
    </div>

    <div>
      <div class="card-box">
        <h3 style="margin-top:0;">Обобщение на поръчката</h3>
        <?php foreach ($__lines as $__l): ?>
          <div class="cart-row" style="grid-template-columns: 60px 1fr auto;">
            <img src="<?= e($__l['image_url'] ?: '/assets/placeholder.jpg') ?>" alt="">
            <div>
              <p style="margin:0;font-size:13.5px;"><?= e($__l['product']['name']) ?></p>
              <p class="muted" style="margin:2px 0 0;font-size:12px;">Размер: <?= e($__l['size']) ?> × <?= (int)$__l['qty'] ?></p>
              <?php if (is_critical_stock($__l['stock'])): ?>
                <span class="pill pill--warn">Малко наличност</span>
              <?php endif; ?>
            </div>
            <div><?= format_eur($__l['product']['price_eur'] * $__l['qty']) ?></div>
          </div>
        <?php endforeach; ?>
        <div class="cart-totals" style="margin-top:16px;justify-content:space-between;">
          <strong>Общо:</strong>
          <strong><?= format_eur($__totals['eur']) ?></strong>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
function tsPickDelivery(radio) {
  document.querySelectorAll('#delivery-form .delivery-card').forEach(function (c) { c.classList.remove('delivery-card--selected'); });
  radio.closest('.delivery-card').classList.add('delivery-card--selected');
  var isOffice = radio.value === 'office';
  document.getElementById('address-fields').style.display = isOffice ? 'none' : '';
  document.getElementById('office-fields').style.display = isOffice ? '' : 'none';
}
function tsPickPayment(radio) {
  var form = radio.closest('form');
  form.querySelectorAll('.delivery-card').forEach(function (c) { c.classList.remove('delivery-card--selected'); });
  radio.closest('.delivery-card').classList.add('delivery-card--selected');
}
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
