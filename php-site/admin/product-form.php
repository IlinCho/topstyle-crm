<?php
$activeNav = 'products';

$__id = isset($_GET['id']) ? trim($_GET['id']) : '';
$__existing = $__id !== '' ? db_one('SELECT * FROM product WHERE id = ?', [$__id]) : null;

$pageTitle = $__existing ? 'Редакция на продукт' : 'Нов продукт';
require __DIR__ . '/../includes/admin-header.php';

$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $sku = trim($_POST['sku'] ?? '');
    $slug = trim($_POST['slug'] ?? '') ?: slugify_basic($name);
    $description = trim($_POST['description'] ?? '');
    $material = trim($_POST['material'] ?? '');
    $color = trim($_POST['color'] ?? '');
    $priceEur = (float)($_POST['price_eur'] ?? 0);
    $priceBgn = (float)($_POST['price_bgn'] ?? 0);
    $active = isset($_POST['active']) ? 1 : 0;
    $categoryId = trim($_POST['category_id'] ?? '');
    $categoryRank = parse_category_rank($_POST['category_rank'] ?? '');
    $badgeKeys = isset($_POST['badges']) && is_array($_POST['badges']) ? $_POST['badges'] : [];
    $badges = serialize_badges($badgeKeys);

    if ($name === '' || $sku === '' || $categoryId === '' || $priceBgn <= 0 || $priceEur <= 0) {
        $__error = 'Моля, попълни име, SKU, категория и валидни цени.';
    } else {
        try {
            if ($__existing) {
                db_query(
                    'UPDATE product SET name=?, sku=?, slug=?, description=?, material=?, color=?, price_eur=?, price_bgn=?, active=?, category_id=?, category_rank=?, badges=? WHERE id=?',
                    [$name, $sku, $slug, $description, $material, $color, $priceEur, $priceBgn, $active, $categoryId, $categoryRank, $badges, $__existing['id']]
                );
                $__productId = $__existing['id'];
            } else {
                $__productId = db_id();
                db_query(
                    'INSERT INTO product (id, sku, name, slug, description, material, color, price_eur, price_bgn, active, category_rank, badges, category_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [$__productId, $sku, $name, $slug, $description, $material, $color, $priceEur, $priceBgn, $active, $categoryRank, $badges, $categoryId]
                );
            }

            // Images: simplest possible model for a no-build-step shared-host
            // site - one image URL per line. Rebuilt from scratch on every save.
            db_query('DELETE FROM product_image WHERE product_id = ?', [$__productId]);
            $__urls = array_filter(array_map('trim', explode("\n", $_POST['image_urls'] ?? '')));
            $__pos = 0;
            foreach ($__urls as $__url) {
                db_query('INSERT INTO product_image (id, product_id, url, position) VALUES (?, ?, ?, ?)', [db_id(), $__productId, $__url, $__pos]);
                $__pos++;
            }

            // Variants: rebuilt from scratch on every save from the table rows.
            db_query('DELETE FROM product_variant WHERE product_id = ?', [$__productId]);
            $__sizes = $_POST['variant_size'] ?? [];
            $__colors = $_POST['variant_color'] ?? [];
            $__stocks = $_POST['variant_stock'] ?? [];
            foreach ($__sizes as $__i => $__size) {
                $__size = trim($__size);
                if ($__size === '') continue;
                $__vColor = trim($__colors[$__i] ?? '');
                $__vStock = max(0, (int)($__stocks[$__i] ?? 0));
                db_query(
                    'INSERT INTO product_variant (id, product_id, size, color, stock) VALUES (?, ?, ?, ?, ?)',
                    [db_id(), $__productId, $__size, $__vColor, $__vStock]
                );
            }

            redirect_to('/admin/products.php');
        } catch (PDOException $e) {
            $__error = 'Грешка при запис — провери дали SKU/slug вече не се използват от друг продукт.';
        }
    }
}

$__categories = db_all('SELECT * FROM category ORDER BY position ASC, name ASC');
$__categoryFlat = flatten_category_tree(build_category_tree($__categories));
$__existingBadges = $__existing ? parse_badges($__existing['badges'] ?? '') : [];

// Existing distinct material/color values across the catalog, offered as
// <datalist> autocomplete so admins reuse "памук с еластант" instead of
// typing near-duplicates that would fragment the category-page filter facets.
$__materialOptions = array_values(array_unique(array_filter(array_column(db_all('SELECT DISTINCT material FROM product'), 'material'))));
sort($__materialOptions, SORT_STRING | SORT_FLAG_CASE);
$__colorOptions = array_values(array_unique(array_filter(array_merge(
    array_column(db_all('SELECT DISTINCT color FROM product'), 'color'),
    array_column(db_all('SELECT DISTINCT color FROM product_variant'), 'color')
))));
sort($__colorOptions, SORT_STRING | SORT_FLAG_CASE);
$__existingImages = $__existing ? db_all('SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC', [$__existing['id']]) : [];
$__existingVariants = $__existing ? db_all('SELECT * FROM product_variant WHERE product_id = ? ORDER BY size ASC', [$__existing['id']]) : [];
$__imageUrlsText = implode("\n", array_map(fn($i) => $i['url'], $__existingImages));

// Always render at least a few blank variant rows so the admin can add sizes
// to a brand-new product without any JS.
$__variantRows = $__existingVariants;
while (count($__variantRows) < 8) {
    $__variantRows[] = ['size' => '', 'color' => '', 'stock' => ''];
}
?>
<div class="admin-topbar">
  <h1 class="admin-h1"><?= $__existing ? 'Редакция на продукт' : 'Нов продукт' ?></h1>
  <a href="/admin/products.php" class="btn btn--ghost">Назад</a>
</div>
<?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>

<datalist id="material-options">
  <?php foreach ($__materialOptions as $__m): ?><option value="<?= e($__m) ?>"><?php endforeach; ?>
</datalist>
<datalist id="color-options">
  <?php foreach ($__colorOptions as $__c): ?><option value="<?= e($__c) ?>"><?php endforeach; ?>
</datalist>

<form method="POST" action="/admin/product-form.php<?= $__existing ? '?id=' . urlencode($__existing['id']) : '' ?>">
  <div class="card-box">
    <h3 style="margin-top:0;">Основна информация</h3>
    <div class="form-grid">
      <div class="field">
        <label>Име</label>
        <input type="text" name="name" value="<?= e($__existing['name'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>SKU</label>
        <input type="text" name="sku" value="<?= e($__existing['sku'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>Slug (по избор — генерира се от името)</label>
        <input type="text" name="slug" value="<?= e($__existing['slug'] ?? '') ?>">
      </div>
      <div class="field">
        <label>Категория</label>
        <select name="category_id" required>
          <option value="">— Избери категория —</option>
          <?php foreach ($__categoryFlat as $__c): ?>
            <option value="<?= e($__c['id']) ?>" <?= (($__existing['category_id'] ?? '') === $__c['id']) ? 'selected' : '' ?>>
              <?= str_repeat('— ', $__c['depth']) . e($__c['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="field">
        <label>Цена (лв.)</label>
        <input type="number" step="0.01" name="price_bgn" value="<?= e($__existing['price_bgn'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>Цена (€)</label>
        <input type="number" step="0.01" name="price_eur" value="<?= e($__existing['price_eur'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>Материя (състав)</label>
        <input type="text" name="material" value="<?= e($__existing['material'] ?? '') ?>" list="material-options">
      </div>
      <div class="field">
        <label>Цвят</label>
        <input type="text" name="color" value="<?= e($__existing['color'] ?? '') ?>" list="color-options">
      </div>
      <div class="field">
        <label>Позиция в категорията (1–8, по избор)</label>
        <input type="number" min="1" max="8" name="category_rank" value="<?= e((string)($__existing['category_rank'] ?? '')) ?>">
      </div>
      <div class="field">
        <label><input type="checkbox" name="active" value="1" <?= (!$__existing || $__existing['active']) ? 'checked' : '' ?>> Активен (виждащ се в магазина)</label>
      </div>
    </div>
    <div class="field">
      <label>Описание</label>
      <textarea name="description"><?= e($__existing['description'] ?? '') ?></textarea>
    </div>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Значки</h3>
    <?php foreach (badge_defs() as $__key => $__def): ?>
      <label style="margin-right:16px;">
        <input type="checkbox" name="badges[]" value="<?= e($__key) ?>" <?= in_array($__key, $__existingBadges, true) ? 'checked' : '' ?>>
        <?= e($__def['label']) ?>
      </label>
    <?php endforeach; ?>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Снимки</h3>
    <div class="field">
      <label>Един URL адрес на ред (първият е основната снимка)</label>
      <textarea name="image_urls" rows="4"><?= e($__imageUrlsText) ?></textarea>
    </div>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Размери и наличност</h3>
    <table class="variant-table">
      <thead><tr><th>Размер</th><th>Цвят</th><th>Наличност (бр.)</th></tr></thead>
      <tbody>
        <?php foreach ($__variantRows as $__v): ?>
          <tr>
            <td><input type="text" name="variant_size[]" value="<?= e($__v['size']) ?>" placeholder="напр. M"></td>
            <td><input type="text" name="variant_color[]" value="<?= e($__v['color']) ?>" placeholder="по избор" list="color-options"></td>
            <td><input type="number" min="0" name="variant_stock[]" value="<?= e((string)$__v['stock']) ?>"></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <p class="muted" style="font-size:12px;">Остави размера празен, за да пропуснеш този ред.</p>
  </div>

  <button type="submit" class="btn">Запази продукта</button>
</form>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
