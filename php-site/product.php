<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/scarcity.php';
require_once __DIR__ . '/includes/ratings.php';

$__slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$__product = $__slug !== '' ? db_one('SELECT * FROM product WHERE slug = ? AND active = 1', [$__slug]) : null;

if (!$__product) {
    $pageTitle = 'Продуктът не е намерен';
    require __DIR__ . '/includes/header.php';
    echo '<div class="container"><p class="muted" style="margin-top:24px;">Този продукт не съществува или вече не е наличен.</p></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$pageTitle = $__product['name'];
require __DIR__ . '/includes/header.php';

$__images = db_all('SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC', [$__product['id']]);
$__variants = db_all('SELECT * FROM product_variant WHERE product_id = ?', [$__product['id']]);

// Sort sizes into a sensible human order; anything not in the known list
// falls back to the end, alphabetically among themselves.
$__sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
usort($__variants, function ($a, $b) use ($__sizeOrder) {
    $ia = array_search($a['size'], $__sizeOrder, true);
    $ib = array_search($b['size'], $__sizeOrder, true);
    if ($ia === false && $ib === false) return strcmp($a['size'], $b['size']);
    if ($ia === false) return 1;
    if ($ib === false) return -1;
    return $ia <=> $ib;
});

$__badges = parse_badges($__product['badges'] ?? '');
$__rating = get_product_rating($__product['id']);
$__reviews = db_all('SELECT * FROM review WHERE product_id = ? ORDER BY created_at DESC', [$__product['id']]);
$__mainImage = $__images[0]['url'] ?? '/assets/placeholder.jpg';
?>
<div class="container">
  <div class="pdp">
    <div>
      <div class="pdp__img-wrap" id="pdp-img-wrap" onmouseenter="tsPdpZoomEnter()" onmouseleave="tsPdpZoomLeave()" onmousemove="tsPdpZoomMove(event)">
        <img src="<?= e($__mainImage) ?>" alt="<?= e($__product['name']) ?>" class="pdp__img" id="pdp-main-img">
        <div class="pdp__img-zoom" id="pdp-img-zoom" style="display:none;background-image:url('<?= e($__mainImage) ?>');"></div>
      </div>
      <?php if (count($__images) > 1): ?>
        <div class="pdp__thumbs">
          <?php foreach ($__images as $__i => $__img): ?>
            <button type="button"
                    class="pdp__thumb<?= $__i === 0 ? ' pdp__thumb--active' : '' ?>"
                    onclick="tsSelectImage(this, '<?= e($__img['url']) ?>')">
              <img src="<?= e($__img['url']) ?>" alt="<?= e($__product['name']) ?>">
            </button>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
    <div>
      <?php if ($__badges): ?>
        <div class="card__badges">
          <?php foreach ($__badges as $__bk): $__bdef = badge_defs()[$__bk] ?? null; if (!$__bdef) continue; ?>
            <span class="badge <?= e($__bdef['class']) ?>"><?= e($__bdef['label']) ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <h1 class="pdp__title"><?= e($__product['name']) ?></h1>

      <div class="pdp__rating-row">
        <a href="#reviews" class="pdp__rating-link"><?= render_rating_stars($__rating['avg'], $__rating['count'], 'md') ?></a>
      </div>
      <p class="pdp__trust-line"><?= e(CUSTOMERS_SERVED_TEXT) ?></p>

      <p class="pdp__price">
        <?= format_bgn($__product['price_bgn']) ?>
        <small><?= format_eur($__product['price_eur']) ?></small>
      </p>

      <p class="pdp__meta">
        <?php if ($__product['material']): ?>Материя: <?= e($__product['material']) ?><br><?php endif; ?>
        <?php if ($__product['color']): ?>Цвят: <?= e($__product['color']) ?><br><?php endif; ?>
        <?= nl2br(e($__product['description'])) ?>
      </p>

      <?php if (SAME_DAY_CUTOFF_TIME): ?>
        <p class="urgency-line">🟢 Поръчай до <?= e(SAME_DAY_CUTOFF_TIME) ?> ч. и получи пратката още утре</p>
      <?php endif; ?>

      <?php if (isset($_GET['outofstock'])): ?>
        <p class="error-text">Този размер вече е изчерпан — избери друг или се запиши за наличност.</p>
      <?php endif; ?>
      <?php if (isset($_GET['alert_ok'])): ?>
        <p class="scarcity-badge scarcity-badge--ok">Записахме те — ще ти пишем при наличност.</p>
      <?php endif; ?>
      <?php if (isset($_GET['quick_error'])): ?>
        <p class="error-text">Моля, избери размер и въведи валидни име и телефон.</p>
      <?php endif; ?>

      <form method="POST" action="/add-to-cart.php" id="add-to-cart-form">
        <input type="hidden" name="product_id" value="<?= e($__product['id']) ?>">
        <input type="hidden" name="qty" value="1">
        <input type="hidden" name="size" id="selected-size-input" value="">

        <p class="opt-label">Избери размер</p>
        <div class="opt-row" id="size-row">
          <?php foreach ($__variants as $__v): $__hint = get_compact_stock_hint((int)$__v['stock']); ?>
            <button type="button"
                    class="opt<?= ((int)$__v['stock'] <= 0) ? ' disabled' : '' ?>"
                    data-size="<?= e($__v['size']) ?>"
                    data-stock="<?= (int)$__v['stock'] ?>"
                    onclick="tsSelectSize(this)">
              <?= e($__v['size']) ?>
              <?php if ($__hint): ?><span class="size-chip-hint"><?= e($__hint) ?></span><?php endif; ?>
            </button>
          <?php endforeach; ?>
        </div>

        <p class="error-text" id="size-error" style="display:none;">Моля, избери размер преди да добавиш в количката.</p>
        <div id="scarcity-area"></div>

        <button type="submit" class="btn" id="add-to-cart-btn">Добави в количката</button>
        <button type="button" class="btn btn--ghost" id="quick-order-open-btn" onclick="tsOpenQuickOrder()" style="margin-left:12px;">📞 Поръчай бързо</button>
      </form>

      <p class="urgency-line--soft" style="margin-top:12px;">🚚 Доставка с преглед и тест.</p>

      <div class="stock-alert-box" id="stock-alert-box" style="display:none;">
        <p>Този размер е изчерпан. Уведоми ме, когато се появи наличност:</p>
        <form method="POST" action="/stock-alert.php" class="stock-alert-box__row">
          <input type="hidden" name="product_id" value="<?= e($__product['id']) ?>">
          <input type="hidden" name="size" id="alert-size-input" value="">
          <input type="email" name="email" placeholder="Имейл" required>
          <button type="submit" class="btn btn--sm">Уведоми ме</button>
        </form>
      </div>

      <?php /* "Бърза поръчка" - name + phone only, no cart/checkout. The store
               calls back to confirm address, mirroring AddToCart.tsx. */ ?>
      <?php if (isset($_GET['quick_ok'])): ?>
        <div class="stock-alert-box" style="margin-top:14px;">
          <p style="margin:0;font-weight:600;color:var(--brand-green);">
            ✓ Поръчката е приета (№ <?= e($_GET['quick_order_number'] ?? '') ?>). Ще Ви позвъним на <?= e($_GET['quick_phone'] ?? '') ?>, за да потвърдим адреса за доставка.
          </p>
        </div>
      <?php else: ?>
        <div class="stock-alert-box" id="quick-order-box" style="display:none;margin-top:14px;">
          <p style="margin:0 0 8px;font-weight:600;">Бърза поръчка — оставете име и телефон, ние ще Ви се обадим за адреса</p>
          <form method="POST" action="/quick-order.php" id="quick-order-form">
            <input type="hidden" name="product_id" value="<?= e($__product['id']) ?>">
            <input type="hidden" name="size" id="quick-size-input" value="">
            <div style="display:flex;flex-direction:column;gap:8px;">
              <input type="text" name="name" placeholder="Име" required>
              <input type="tel" name="phone" placeholder="Телефон" required>
              <div style="display:flex;gap:8px;">
                <button type="submit" class="btn btn--sm">Поръчай</button>
                <button type="button" class="btn btn--ghost btn--sm" onclick="document.getElementById('quick-order-box').style.display='none';">Отказ</button>
              </div>
            </div>
          </form>
        </div>
      <?php endif; ?>

      <ul class="trust-strip" style="margin-top:22px;">
        <li><span class="trust-strip__check">&#10003;</span> Преглед и тест</li>
        <li><span class="trust-strip__check">&#10003;</span> Лесна замяна</li>
        <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
        <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
      </ul>
    </div>
  </div>

  <section class="reviews-section" id="reviews">
    <h2 class="section-title" style="margin-top:0;">Отзиви</h2>
    <?= render_rating_stars($__rating['avg'], $__rating['count'], 'md') ?>

    <?php if (isset($_GET['review_ok'])): ?>
      <p class="scarcity-badge scarcity-badge--ok">Благодарим за отзива!</p>
    <?php endif; ?>
    <?php if (isset($_GET['review_error'])): ?>
      <p class="error-text">Моля, попълни име, оценка (1-5) и опитай отново.</p>
    <?php endif; ?>

    <div class="card-box mt-24">
      <p class="opt-label" style="margin-top:0;">Остави отзив</p>
      <form method="POST" action="/submit-review.php">
        <input type="hidden" name="product_id" value="<?= e($__product['id']) ?>">
        <div class="form-grid">
          <div class="field">
            <label>Име</label>
            <input type="text" name="author_name" required>
          </div>
          <div class="field">
            <label>Оценка</label>
            <select name="rating" required>
              <option value="5">5 — Отлично</option>
              <option value="4">4 — Много добро</option>
              <option value="3">3 — Добро</option>
              <option value="2">2 — Средно</option>
              <option value="1">1 — Слабо</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Коментар</label>
          <textarea name="comment"></textarea>
        </div>
        <button type="submit" class="btn btn--sm">Публикувай отзив</button>
      </form>
    </div>

    <?php if (!$__reviews): ?>
      <p class="muted mt-24">Все още няма отзиви за този продукт.</p>
    <?php else: ?>
      <div class="review-list">
        <?php foreach ($__reviews as $__r): ?>
          <div class="review-item">
            <div class="review-item__top">
              <strong><?= e($__r['author_name']) ?></strong>
              <?= render_rating_stars((float)$__r['rating'], 0, 'sm') ?>
            </div>
            <?php if ($__r['comment']): ?><p class="review-item__comment"><?= nl2br(e($__r['comment'])) ?></p><?php endif; ?>
            <p class="review-item__date"><?= e(date('d.m.Y', strtotime($__r['created_at']))) ?></p>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </section>
</div>

<script>
// Mirrors includes/scarcity.php's get_scarcity() tier-for-tier, so the
// message shown when picking a size never disagrees with the server-rendered
// version elsewhere on the site. Kept intentionally tiny (no build step).
function tsGetScarcity(stock) {
  stock = parseInt(stock, 10);
  if (stock <= 0) return {icon: '⛔', text: 'Изчерпан', tone: 'out'};
  if (stock === 1) return {icon: '🔴', text: 'Последен наличен брой', tone: 'danger'};
  if (stock <= 4) return {icon: '🟠', text: 'Остават само ' + stock + ' броя', tone: 'warn'};
  if (stock <= 9) return {icon: '🟠', text: 'Остават няколко броя', tone: 'warn'};
  if (stock <= 20) return {icon: '🟡', text: 'Ограничена наличност', tone: 'info'};
  return {icon: '✔', text: 'В наличност', tone: 'ok'};
}

function tsSelectImage(btn, url) {
  document.getElementById('pdp-main-img').src = url;
  document.getElementById('pdp-img-zoom').style.backgroundImage = "url('" + url + "')";
  document.querySelectorAll('.pdp__thumb').forEach(function (b) { b.classList.remove('pdp__thumb--active'); });
  btn.classList.add('pdp__thumb--active');
}

// Hover-zoom on desktop (like the original site's product page): moving the
// cursor over the image reveals a zoomed-in crop under the pointer via a
// background-position pan on an overlay layer - the CSS media query already
// hides #pdp-img-zoom on touch devices, this just skips the work there too.
function tsPdpZoomEnter() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.getElementById('pdp-img-zoom').style.display = 'block';
}
function tsPdpZoomLeave() {
  document.getElementById('pdp-img-zoom').style.display = 'none';
}
function tsPdpZoomMove(e) {
  var wrap = document.getElementById('pdp-img-wrap');
  var rect = wrap.getBoundingClientRect();
  var x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  var y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
  document.getElementById('pdp-img-zoom').style.backgroundPosition = x + '% ' + y + '%';
}

function tsOpenQuickOrder() {
  var size = document.getElementById('selected-size-input').value;
  if (!size) {
    var err = document.getElementById('size-error');
    err.style.display = 'block';
    err.scrollIntoView({behavior: 'smooth', block: 'center'});
    return;
  }
  document.getElementById('quick-size-input').value = size;
  document.getElementById('quick-order-box').style.display = 'block';
}

function tsSelectSize(btn) {
  document.querySelectorAll('#size-row .opt').forEach(function (b) { b.classList.remove('selected'); });
  btn.classList.add('selected');

  var size = btn.dataset.size;
  var stock = btn.dataset.stock;
  document.getElementById('selected-size-input').value = size;
  var quickSizeInput = document.getElementById('quick-size-input');
  if (quickSizeInput) quickSizeInput.value = size;
  document.getElementById('size-error').style.display = 'none';

  var s = tsGetScarcity(stock);
  document.getElementById('scarcity-area').innerHTML =
    '<p class="scarcity-badge scarcity-badge--' + s.tone + '"><span aria-hidden="true">' + s.icon + '</span> ' + s.text + '</p>';

  var alertBox = document.getElementById('stock-alert-box');
  var addBtn = document.getElementById('add-to-cart-btn');
  if (parseInt(stock, 10) <= 0) {
    alertBox.style.display = 'block';
    document.getElementById('alert-size-input').value = size;
    addBtn.textContent = 'Изчерпан размер';
  } else {
    alertBox.style.display = 'none';
    addBtn.textContent = 'Добави в количката';
  }
}

document.getElementById('add-to-cart-form').addEventListener('submit', function (e) {
  var size = document.getElementById('selected-size-input').value;
  if (!size) {
    e.preventDefault();
    var err = document.getElementById('size-error');
    err.style.display = 'block';
    err.scrollIntoView({behavior: 'smooth', block: 'center'});
  }
});
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
