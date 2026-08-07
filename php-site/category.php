<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/product_filters.php';

$__slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$__allCategories = db_all('SELECT * FROM category ORDER BY position ASC, name ASC');

// No slug at all -> show a directory of top-level categories instead of 404ing.
if ($__slug === '') {
    $pageTitle = 'Категории';
    require __DIR__ . '/includes/header.php';
    $__roots = build_category_tree($__allCategories);
    ?>
    <div class="container">
      <h1 class="section-title" style="margin-top:20px;">Категории</h1>
      <div class="chip-row">
        <?php foreach ($__roots as $__r): ?>
          <a href="/category.php?slug=<?= urlencode($__r['slug']) ?>" class="chip"><?= e($__r['name']) ?></a>
        <?php endforeach; ?>
      </div>
    </div>
    <?php
    require __DIR__ . '/includes/footer.php';
    exit;
}

$__category = null;
foreach ($__allCategories as $__c) {
    if ($__c['slug'] === $__slug) { $__category = $__c; break; }
}

if (!$__category) {
    $pageTitle = 'Категорията не е намерена';
    require __DIR__ . '/includes/header.php';
    echo '<div class="container"><p class="muted" style="margin-top:24px;">Тази категория не съществува.</p></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$pageTitle = $__category['name'];
require __DIR__ . '/includes/header.php';

// Direct children of the current category, used as filter chips.
$__children = array_values(array_filter($__allCategories, fn($c) => ($c['parent_id'] ?? null) === $__category['id']));
usort($__children, fn($a, $b) => $a['position'] <=> $b['position']);

$__subSlug = isset($_GET['sub']) ? trim($_GET['sub']) : '';
$__activeChild = null;
if ($__subSlug !== '') {
    foreach ($__children as $__c) {
        if ($__c['slug'] === $__subSlug) { $__activeChild = $__c; break; }
    }
}

$__categoryIds = category_and_descendant_ids($__category, $__allCategories);

$__placeholders = implode(',', array_fill(0, count($__categoryIds), '?'));
$__natural = db_all(
    "SELECT * FROM product WHERE active = 1 AND category_id IN ($__placeholders) ORDER BY created_at DESC",
    $__categoryIds
);

$__scoped = $__activeChild
    ? array_values(array_filter($__natural, fn($p) => $p['category_id'] === $__activeChild['id']))
    : $__natural;

$__scopedIds = array_column($__scoped, 'id');
$__variantsByProduct = fetch_variants_by_product_ids($__scopedIds);
$__facets = compute_facets($__scoped, $__variantsByProduct);

$__selSizes = ts_array_param($_GET['size'] ?? null);
$__selColors = ts_array_param($_GET['color'] ?? null);
$__selMaterials = ts_array_param($_GET['material'] ?? null);
$__minPrice = isset($_GET['minPrice']) && $_GET['minPrice'] !== '' ? (float)$_GET['minPrice'] : null;
$__maxPrice = isset($_GET['maxPrice']) && $_GET['maxPrice'] !== '' ? (float)$_GET['maxPrice'] : null;

$__filtered = apply_product_filters($__scoped, $__variantsByProduct, [
    'sizes' => $__selSizes,
    'colors' => $__selColors,
    'materials' => $__selMaterials,
    'min_price' => $__minPrice,
    'max_price' => $__maxPrice,
]);
$__products = apply_category_rank_pins($__filtered);

$__hasActiveFilters = $__activeChild || $__selSizes || $__selColors || $__selMaterials || $__minPrice !== null || $__maxPrice !== null;
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">
    <?= e($__category['name']) ?> <span class="muted" style="font-weight:400;font-size:14px;">(<?= count($__products) ?> продукта)</span>
  </h1>

  <details class="filter-panel">
    <summary>Филтри <?php if ($__hasActiveFilters): ?><span class="filter-panel__badge">активни</span><?php endif; ?></summary>
    <form method="GET" action="/category.php" class="filter-panel__body">
      <input type="hidden" name="slug" value="<?= e($__category['slug']) ?>">

      <?php if ($__children): ?>
        <div class="filter-section">
          <div class="filter-section__title">Категории</div>
          <label class="filter-checkbox-row">
            <input type="radio" name="sub" value="" <?= !$__activeChild ? 'checked' : '' ?>>
            Всички
          </label>
          <?php foreach ($__children as $__ch): ?>
            <label class="filter-checkbox-row">
              <input type="radio" name="sub" value="<?= e($__ch['slug']) ?>" <?= ($__activeChild && $__activeChild['id'] === $__ch['id']) ? 'checked' : '' ?>>
              <?= e($__ch['name']) ?>
            </label>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <div class="filter-section">
        <div class="filter-section__title">Цена (лв.)</div>
        <div class="filter-price-row">
          <input type="number" name="minPrice" placeholder="<?= e((string)$__facets['price_min']) ?>" value="<?= e($_GET['minPrice'] ?? '') ?>" min="0">
          <span>—</span>
          <input type="number" name="maxPrice" placeholder="<?= e((string)$__facets['price_max']) ?>" value="<?= e($_GET['maxPrice'] ?? '') ?>" min="0">
        </div>
      </div>

      <?php if ($__facets['sizes']): ?>
        <div class="filter-section">
          <div class="filter-section__title">Размер</div>
          <?php foreach ($__facets['sizes'] as $__opt): ?>
            <label class="filter-checkbox-row">
              <input type="checkbox" name="size[]" value="<?= e($__opt['value']) ?>" <?= in_array($__opt['value'], $__selSizes, true) ? 'checked' : '' ?>>
              <?= e($__opt['value']) ?> <span class="muted">(<?= (int)$__opt['count'] ?>)</span>
            </label>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <?php if ($__facets['colors']): ?>
        <div class="filter-section">
          <div class="filter-section__title">Цвят</div>
          <?php foreach ($__facets['colors'] as $__opt): ?>
            <label class="filter-checkbox-row">
              <input type="checkbox" name="color[]" value="<?= e($__opt['value']) ?>" <?= in_array($__opt['value'], $__selColors, true) ? 'checked' : '' ?>>
              <?= e($__opt['value']) ?> <span class="muted">(<?= (int)$__opt['count'] ?>)</span>
            </label>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <?php if ($__facets['materials']): ?>
        <div class="filter-section">
          <div class="filter-section__title">Състав</div>
          <?php foreach ($__facets['materials'] as $__opt): ?>
            <label class="filter-checkbox-row">
              <input type="checkbox" name="material[]" value="<?= e($__opt['value']) ?>" <?= in_array($__opt['value'], $__selMaterials, true) ? 'checked' : '' ?>>
              <?= e($__opt['value']) ?> <span class="muted">(<?= (int)$__opt['count'] ?>)</span>
            </label>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <div class="filter-actions">
        <a href="/category.php?slug=<?= urlencode($__category['slug']) ?>" class="filter-actions__clear">Изчисти</a>
        <button type="submit" class="btn">Приложи филтри</button>
      </div>
    </form>
  </details>

  <?php if (!$__products): ?>
    <p class="muted">Няма продукти, отговарящи на избраните филтри.</p>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($__products as $__p): ?>
        <?php include __DIR__ . '/includes/product-card.php'; ?>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
