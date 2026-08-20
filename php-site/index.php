<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = null;
require __DIR__ . '/includes/header.php';

$__allCategories = db_all('SELECT * FROM category ORDER BY position ASC');
// Homepage tiles show exactly the first 3 top-level categories ("Топ
// категории") - matches the original site's compact 3-tile row and the
// .category-tiles grid (repeat(3, 1fr)) in assets/style.css.
$__topCategories = array_slice(array_values(array_filter($__allCategories, fn($c) => empty($c['parent_id']))), 0, 3);

// For each top category, pull its best products (subcategories included,
// admin category_rank pins applied - same merchandising logic as
// category.php) to show as a "Топ продукти" preview row, and to fall back
// to a real product photo for the tile image when the admin hasn't
// uploaded one for the category yet.
$__topCategorySections = [];
foreach ($__topCategories as $__c) {
    $__categoryIds = category_and_descendant_ids($__c, $__allCategories);
    $__placeholders = implode(',', array_fill(0, count($__categoryIds), '?'));
    $__naturalOrder = db_all(
        "SELECT * FROM product WHERE category_id IN ($__placeholders) AND active = 1 ORDER BY created_at DESC",
        $__categoryIds
    );
    $__catProducts = array_slice(apply_category_rank_pins($__naturalOrder), 0, 4);
    $__tileImage = $__c['image_url'] ?: '';
    if (!$__tileImage && $__catProducts) {
        $__firstImg = db_one('SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1', [$__catProducts[0]['id']]);
        $__tileImage = $__firstImg ? $__firstImg['url'] : '';
    }
    $__topCategorySections[] = ['category' => $__c, 'products' => $__catProducts, 'tile_image' => $__tileImage];
}

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
  <?php if ($__topCategories): ?>
    <div class="category-tiles">
      <?php foreach ($__topCategorySections as $__sec): $__c = $__sec['category']; ?>
        <a href="/category.php?slug=<?= urlencode($__c['slug']) ?>" class="category-tile">
          <img src="<?= e($__sec['tile_image'] ?: 'https://placehold.co/600x450/eeeeee/999999?text=TopStyle') ?>" alt="<?= e($__c['name']) ?>" class="category-tile__img">
          <div class="category-tile__overlay">
            <span class="category-tile__label">Категория</span>
            <span class="category-tile__name"><?= e($__c['name']) ?></span>
            <span class="category-tile__cta">Разгледай →</span>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <?php foreach ($__topCategorySections as $__sec): $__c = $__sec['category']; ?>
    <?php if ($__sec['products']): ?>
      <div class="top-products-section">
        <div class="flex-between">
          <h2 class="section-title"><?= e($__c['name']) ?></h2>
          <a href="/category.php?slug=<?= urlencode($__c['slug']) ?>" class="muted" style="font-size:13px;">Виж всички →</a>
        </div>
        <div class="grid">
          <?php foreach ($__sec['products'] as $__p): ?>
            <?php include __DIR__ . '/includes/product-card.php'; ?>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  <?php endforeach; ?>

  <div class="chip-row" style="margin-top:44px;">
    <?php foreach ($__allCategories as $__cc): ?>
      <a href="/category.php?slug=<?= urlencode($__cc['slug']) ?>" class="chip"><?= e($__cc['name']) ?></a>
    <?php endforeach; ?>
  </div>

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
