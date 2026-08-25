<?php
// Lets the admin manage the 3 homepage "Топ категории" tiles from one place:
// swap the photo (always displayed square via CSS - see .category-tile in
// assets/style.css - so any photo shape works, no manual cropping needed)
// and override the text shown on the tile without renaming the actual
// category (which would also change its menu label and URL).
$activeNav = 'homepage';
$pageTitle = 'Начална страница';
require __DIR__ . '/../includes/admin-header.php';

$__error = '';
$__saved = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $__error = 'Невалидна сесия — презареди страницата и опитай отново.';
    } else {
        $__categoryId = trim($_POST['category_id'] ?? '');
        $__title = trim($_POST['home_tile_title'] ?? '');
        if ($__categoryId !== '') {
            $__uploaded = save_uploaded_category_tile_image($_FILES['tile_image'] ?? []);
            if ($__uploaded !== null) {
                db_query('UPDATE category SET home_tile_title = ?, image_url = ? WHERE id = ?', [$__title, $__uploaded, $__categoryId]);
            } else {
                db_query('UPDATE category SET home_tile_title = ? WHERE id = ?', [$__title, $__categoryId]);
            }
            redirect_to('/admin/homepage.php?saved=1');
        }
    }
}
if (isset($_GET['saved'])) $__saved = true;

$__allCategories = db_all('SELECT * FROM category ORDER BY position ASC');
$__topCategories = array_slice(array_values(array_filter($__allCategories, fn($c) => empty($c['parent_id']))), 0, 3);

$__topCategorySections = [];
foreach ($__topCategories as $__c) {
    $__categoryIds = category_and_descendant_ids($__c, $__allCategories);
    $__placeholders = implode(',', array_fill(0, count($__categoryIds), '?'));
    $__naturalOrder = db_all(
        "SELECT * FROM product WHERE category_id IN ($__placeholders) AND active = 1 ORDER BY created_at DESC",
        $__categoryIds
    );
    $__catProducts = array_slice(apply_category_rank_pins(filter_in_stock($__naturalOrder)), 0, 1);
    $__tileImage = $__c['image_url'] ?: '';
    if (!$__tileImage && $__catProducts) {
        $__firstImg = db_one('SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1', [$__catProducts[0]['id']]);
        $__tileImage = $__firstImg ? $__firstImg['url'] : '';
    }
    $__topCategorySections[] = ['category' => $__c, 'tile_image' => $__tileImage];
}
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Начална страница</h1>
</div>

<?php if ($__saved): ?>
  <div class="card-box" style="background:#e7f6ec;border-color:#bfe6cb;">Плочката е обновена.</div>
<?php endif; ?>
<?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>

<?php if (!$__topCategories): ?>
  <div class="card-box"><p class="muted" style="margin:0;">Нямаш още основни категории — виж <a href="/admin/categories.php">Категории</a>.</p></div>
<?php else: ?>

  <div class="card-box">
    <h3 style="margin-top:0;">Преглед — как изглежда в момента на сайта</h3>
    <div class="container" style="padding:0;">
      <div class="category-tiles">
        <?php foreach ($__topCategorySections as $__sec): $__c = $__sec['category']; ?>
          <div class="category-tile">
            <img src="<?= e($__sec['tile_image'] ?: 'https://placehold.co/600x450/eeeeee/999999?text=TopStyle') ?>" alt="<?= e($__c['home_tile_title'] ?: $__c['name']) ?>" class="category-tile__img">
            <div class="category-tile__overlay">
              <span class="category-tile__label">Категория</span>
              <span class="category-tile__name"><?= e($__c['home_tile_title'] ?: $__c['name']) ?></span>
              <span class="category-tile__cta">Разгледай →</span>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>

  <div class="form-grid" style="grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));">
    <?php foreach ($__topCategorySections as $__sec): $__c = $__sec['category']; ?>
      <div class="card-box">
        <h3 style="margin-top:0;"><?= e($__c['name']) ?></h3>
        <p class="muted" style="font-size:12px;margin-top:-8px;">Реална категория (меню/URL) — не се променя тук.</p>
        <img src="<?= e($__sec['tile_image'] ?: 'https://placehold.co/600x450/eeeeee/999999?text=TopStyle') ?>" alt=""
             style="width:120px;aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius);display:block;margin-bottom:12px;background:var(--bg-soft);">
        <form method="POST" action="/admin/homepage.php" enctype="multipart/form-data">
          <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="category_id" value="<?= e($__c['id']) ?>">
          <div class="field">
            <label>Текст на плочката</label>
            <input type="text" name="home_tile_title" value="<?= e($__c['home_tile_title']) ?>" placeholder="<?= e($__c['name']) ?>">
          </div>
          <div class="field">
            <label>Нова снимка (по избор — заменя текущата)</label>
            <input type="file" name="tile_image" accept="image/*">
            <p class="muted" style="font-size:11.5px;margin-top:4px;">Показва се автоматично квадратна — качи каквато и снимка, тя ще се изреже центрирано.</p>
          </div>
          <button type="submit" class="btn btn--sm">Запази</button>
        </form>
      </div>
    <?php endforeach; ?>
  </div>

<?php endif; ?>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
