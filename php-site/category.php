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
$__products = apply_category_rank_pins($__natural);
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;"><?= e($__category['name']) ?></h1>

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

  <?php if (!$__products): ?>
    <p class="muted">Все още няма продукти в тази категория.</p>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($__products as $__p): ?>
        <?php include __DIR__ . '/includes/product-card.php'; ?>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
