<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = null;
require __DIR__ . '/includes/header.php';

$__products = db_all(
    'SELECT * FROM product WHERE active = 1 ORDER BY created_at DESC LIMIT 8'
);
?>
<section class="hero">
  <div class="hero__split">
    <img src="/assets/hero.jpg" alt="<?= e(STORE_NAME) ?>" class="hero__photo">
    <div class="hero__panel">
      <h1>Мъжка мода с характер</h1>
      <p>Нова колекция тениски, ризи и аксесоари за всеки повод.</p>
      <p class="hero__authority"><?= e(CUSTOMERS_SERVED_TEXT) ?></p>
      <ul class="hero__value-row">
        <li>🚚 Доставка до 24 часа</li>
        <li>🔄 Лесна замяна</li>
        <li>✔ Преглед и тест при получаване</li>
      </ul>
      <div class="hero__cta">
        <a href="/category.php" class="btn">Пазарувай сега</a>
      </div>
    </div>
  </div>
</section>

<div class="container">
  <h2 class="section-title">Новите ни продукти</h2>
  <?php if (!$__products): ?>
    <p class="muted">Все още няма добавени продукти.</p>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($__products as $__p): ?>
        <?php include __DIR__ . '/includes/product-card.php'; ?>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
