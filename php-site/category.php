<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

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

if ($__activeChild) {
    $__categoryIds = [$__activeChild['id']];
} else {
    $__categoryIds = category_and_descendant_ids($__category, $__allCategories);
}

$__placeholders = implode(',', array_fill(0, count($__categoryIds), '?'));
$__natural = db_all(
    "SELECT * FROM product WHERE active = 1 AND category_id IN ($__placeholders) ORDER BY created_at DESC",
    $__categoryIds
);
$__allProducts = apply_category_rank_pins($__natural);

// Filter option lists come from the category's full (unfiltered) product
// set, so picking one filter never makes the others' checkboxes disappear.
$__materials = array_values(array_unique(array_filter(array_map(fn($p) => $p['material'], $__allProducts))));
sort($__materials);
$__colors = array_values(array_unique(array_filter(array_map(fn($p) => $p['color'], $__allProducts))));
sort($__colors);

$__selMaterials = isset($_GET['material']) ? (array)$_GET['material'] : [];
$__selColors = isset($_GET['color']) ? (array)$_GET['color'] : [];
$__priceMin = (isset($_GET['price_min']) && $_GET['price_min'] !== '') ? (float)$_GET['price_min'] : null;
$__priceMax = (isset($_GET['price_max']) && $_GET['price_max'] !== '') ? (float)$_GET['price_max'] : null;

$__products = array_values(array_filter($__allProducts, function ($p) use ($__selMaterials, $__selColors, $__priceMin, $__priceMax) {
    if ($__selMaterials && !in_array($p['material'], $__selMaterials, true)) return false;
    if ($__selColors && !in_array($p['color'], $__selColors, true)) return false;
    if ($__priceMin !== null && (float)$p['price_eur'] < $__priceMin) return false;
    if ($__priceMax !== null && (float)$p['price_eur'] > $__priceMax) return false;
    return true;
}));

$__activeFilterCount = count($__selMaterials) + count($__selColors) + ($__priceMin !== null ? 1 : 0) + ($__priceMax !== null ? 1 : 0);

// Preserve the current category/subcategory (slug + sub) when the filter
// form submits, since the panel is a plain GET form on this same page.
$__filterActionQs = 'slug=' . urlencode($__category['slug']) . ($__activeChild ? '&sub=' . urlencode($__activeChild['slug']) : '');
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;"><?= e($__category['name']) ?> <span class="muted" style="font-weight:400;font-size:14px;">(<?= count($__products) ?> продукта)</span></h1>

  <?php if ($__children): ?>
    <div class="chip-row">
      <a href="/category.php?slug=<?= urlencode($__category['slug']) ?>" class="chip<?= !$__activeChild ? ' active' : '' ?>">Всички</a>
      <?php foreach ($__children as $__ch): ?>
        <a href="/category.php?slug=<?= urlencode($__category['slug']) ?>&sub=<?= urlencode($__ch['slug']) ?>"
           class="chip<?= ($__activeChild && $__activeChild['id'] === $__ch['id']) ? ' active' : '' ?>">
          <?= e($__ch['name']) ?>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <?php if ($__materials || $__colors): ?>
    <details class="filter-panel"<?= $__activeFilterCount > 0 ? ' open' : '' ?>>
      <summary>
        Филтри
        <?php if ($__activeFilterCount > 0): ?><span class="filter-panel__badge"><?= (int)$__activeFilterCount ?></span><?php endif; ?>
      </summary>
      <form class="filter-panel__body" method="get" action="/category.php">
        <input type="hidden" name="slug" value="<?= e($__category['slug']) ?>">
        <?php if ($__activeChild): ?><input type="hidden" name="sub" value="<?= e($__activeChild['slug']) ?>"><?php endif; ?>

        <?php if ($__materials): ?>
          <div>
            <p class="filter-section__title">Материя</p>
            <?php foreach ($__materials as $__m): ?>
              <label class="filter-checkbox-row">
                <input type="checkbox" name="material[]" value="<?= e($__m) ?>" <?= in_array($__m, $__selMaterials, true) ? 'checked' : '' ?>>
                <?= e($__m) ?>
              </label>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <?php if ($__colors): ?>
          <div>
            <p class="filter-section__title">Цвят</p>
            <?php foreach ($__colors as $__co): ?>
              <label class="filter-checkbox-row">
                <input type="checkbox" name="color[]" value="<?= e($__co) ?>" <?= in_array($__co, $__selColors, true) ? 'checked' : '' ?>>
                <?= e($__co) ?>
              </label>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <div>
          <p class="filter-section__title">Цена (€)</p>
          <div class="filter-price-row">
            <input type="number" name="price_min" placeholder="От" min="0" value="<?= e($_GET['price_min'] ?? '') ?>">
            <span>—</span>
            <input type="number" name="price_max" placeholder="До" min="0" value="<?= e($_GET['price_max'] ?? '') ?>">
          </div>
        </div>

        <div class="filter-actions">
          <button type="submit" class="btn">Приложи</button>
          <a href="/category.php?<?= $__filterActionQs ?>" class="filter-actions__clear">Изчисти филтрите</a>
        </div>
      </form>
    </details>
  <?php endif; ?>

  <?php if (!$__products): ?>
    <p class="muted">Няма продукти по зададените филтри.</p>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($__products as $__p): ?>
        <?php include __DIR__ . '/includes/product-card.php'; ?>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
