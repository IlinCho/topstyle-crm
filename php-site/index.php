<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = null;
require __DIR__ . '/includes/header.php';

// The 3 "top categories" shown under the hero, mirroring the original
// topstyle.bg homepage layout (Категория Мъжки тениски / Мъжки Якета /
// Мъжки Бански, each with "Виж повече"). Display labels are the original
// site's homepage marketing names, which differ slightly from the category
// record's own name (e.g. the category is just "Бански" but the homepage
// tile/section says "Мъжки Бански").
$__homeCategoryDefs = [
    ['slug' => 'mazhki-teniski', 'label' => 'Мъжки тениски'],
    ['slug' => 'mzhki-yaketa', 'label' => 'Мъжки якета'],
    ['slug' => 'banski', 'label' => 'Мъжки бански'],
];

$__homeCategories = [];
foreach ($__homeCategoryDefs as $__def) {
    $__cat = db_one('SELECT * FROM category WHERE slug = ?', [$__def['slug']]);
    if (!$__cat) continue;

    // Natural (newest-first) order, then splice in admin-pinned products
    // (category_rank) at their exact slot - same rule as category.php - then
    // take the top 4. This is what makes the homepage picks "regulируеми":
    // the admin sets category_rank 1-4 on a product and it shows here too.
    $__natural = db_all('SELECT * FROM product WHERE active = 1 AND category_id = ? ORDER BY created_at DESC', [$__cat['id']]);
    $__products = array_slice(apply_category_rank_pins($__natural), 0, 4);

    $__tileImage = $__cat['image_url'] ?: '';
    if ($__tileImage === '' && $__products) {
        $__firstImg = db_one('SELECT url FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1', [$__products[0]['id']]);
        $__tileImage = $__firstImg['url'] ?? '';
    }
    if ($__tileImage === '') {
        $__tileImage = 'https://placehold.co/600x400/eeeeee/999999?text=TopStyle';
    }

    $__homeCategories[] = [
        'category' => $__cat,
        'label' => $__def['label'],
        'products' => $__products,
        'tileImage' => $__tileImage,
    ];
}
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
  <div class="category-tiles">
    <?php foreach ($__homeCategories as $__hc): ?>
      <a href="/category.php?slug=<?= urlencode($__hc['category']['slug']) ?>" class="category-tile">
        <img src="<?= e($__hc['tileImage']) ?>" alt="<?= e($__hc['label']) ?>" class="category-tile__img">
        <div class="category-tile__overlay">
          <span class="category-tile__label">Категория</span>
          <span class="category-tile__name"><?= e($__hc['label']) ?></span>
          <span class="category-tile__cta">Виж повече →</span>
        </div>
      </a>
    <?php endforeach; ?>
  </div>

  <?php foreach ($__homeCategories as $__hc): if (!$__hc['products']) continue; ?>
    <section class="top-products-section">
      <div class="flex-between" style="align-items:baseline;">
        <h2 class="section-title">Топ <?= e($__hc['label']) ?></h2>
        <a href="/category.php?slug=<?= urlencode($__hc['category']['slug']) ?>" class="muted">Виж всички →</a>
      </div>
      <div class="grid">
        <?php foreach ($__hc['products'] as $__p): ?>
          <?php include __DIR__ . '/includes/product-card.php'; ?>
        <?php endforeach; ?>
      </div>
    </section>
  <?php endforeach; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
