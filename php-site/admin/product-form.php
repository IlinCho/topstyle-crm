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

    // Size chart: uploaded file wins over a pasted URL; leaving both empty on
    // an edit keeps the existing value (the URL field is pre-filled with it),
    // so a resave without touching this section doesn't clear it.
    $__sizeChartUploaded = save_uploaded_size_chart_image($_FILES['size_chart_file'] ?? []);
    $sizeChartUrl = $__sizeChartUploaded ?? trim($_POST['size_chart_url'] ?? '');
    $sizeChartNote = trim($_POST['size_chart_note'] ?? '');
    $sizeChartTable = trim($_POST['size_chart_table'] ?? '');

    if ($name === '' || $sku === '' || $categoryId === '' || $priceBgn <= 0 || $priceEur <= 0) {
        $__error = 'Моля, попълни име, SKU, категория и валидни цени.';
    } else {
        try {
            if ($__existing) {
                db_query(
                    'UPDATE product SET name=?, sku=?, slug=?, description=?, material=?, color=?, price_eur=?, price_bgn=?, active=?, category_id=?, category_rank=?, badges=?, size_chart_url=?, size_chart_note=?, size_chart_table=? WHERE id=?',
                    [$name, $sku, $slug, $description, $material, $color, $priceEur, $priceBgn, $active, $categoryId, $categoryRank, $badges, $sizeChartUrl, $sizeChartNote, $sizeChartTable, $__existing['id']]
                );
                $__productId = $__existing['id'];
            } else {
                $__productId = db_id();
                db_query(
                    'INSERT INTO product (id, sku, name, slug, description, material, color, price_eur, price_bgn, active, category_rank, badges, size_chart_url, size_chart_note, size_chart_table, category_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [$__productId, $sku, $name, $slug, $description, $material, $color, $priceEur, $priceBgn, $active, $categoryRank, $badges, $sizeChartUrl, $sizeChartNote, $sizeChartTable, $categoryId]
                );
            }

            // Images: pasted URLs (one per line) come first, then any newly
            // uploaded files are appended after them - so an admin who only
            // uploads files (no pasted URLs) still gets their first upload
            // as the main photo (position 0). Rebuilt from scratch on every save.
            db_query('DELETE FROM product_image WHERE product_id = ?', [$__productId]);
            $__urls = array_filter(array_map('trim', explode("\n", $_POST['image_urls'] ?? '')));
            $__uploadedUrls = save_uploaded_product_images($_FILES['image_files'] ?? []);
            $__urls = array_merge($__urls, $__uploadedUrls);
            $__pos = 0;
            foreach ($__urls as $__url) {
                db_query('INSERT INTO product_image (id, product_id, url, position) VALUES (?, ?, ?, ?)', [db_id(), $__productId, $__url, $__pos]);
                $__pos++;
            }

            // Variants: rebuilt from scratch on every save from the table rows.
            // Color is entered once at the product level ("Цвят") and
            // inherited by every variant row - in this catalog a product
            // never actually has more than one color (confirmed: zero of the
            // 166 seeded products have variants with different colors), so a
            // separate per-variant color field was pure duplicate entry.
            db_query('DELETE FROM product_variant WHERE product_id = ?', [$__productId]);
            $__sizes = $_POST['variant_size'] ?? [];
            $__stocks = $_POST['variant_stock'] ?? [];
            foreach ($__sizes as $__i => $__size) {
                $__size = trim($__size);
                if ($__size === '') continue;
                $__vStock = max(0, (int)($__stocks[$__i] ?? 0));
                db_query(
                    'INSERT INTO product_variant (id, product_id, size, color, stock) VALUES (?, ?, ?, ?, ?)',
                    [db_id(), $__productId, $__size, $color, $__vStock]
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

$__variantRows = $__existingVariants;
if (!$__variantRows) {
    // Brand-new product with no variants yet - prefill S through 6XL so the
    // admin only has to type stock counts, not every size label by hand.
    // They can still delete rows they don't carry.
    foreach (['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'] as $__ds) {
        $__variantRows[] = ['size' => $__ds, 'color' => '', 'stock' => ''];
    }
} else {
    // Editing an existing product - always render a couple of blank rows
    // too, so there's room to add a size it didn't have before, without
    // needing "+ Добави размер".
    while (count($__variantRows) < count($__existingVariants) + 2) {
        $__variantRows[] = ['size' => '', 'color' => '', 'stock' => ''];
    }
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

<div class="flex-between" style="margin-bottom:14px;">
  <span class="muted" style="font-size:12.5px;">Прегледай как ще изглежда в магазина, преди да запазиш</span>
  <button type="button" class="btn btn--ghost btn--sm" onclick="tsPreviewProduct()">👁 Преглед на продукта</button>
</div>

<div id="product-preview-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this) tsClosePreview()">
  <div class="card-box" style="max-width:900px;width:100%;max-height:90vh;overflow-y:auto;background:#fff;">
    <div class="flex-between" style="margin-bottom:16px;">
      <strong>Преглед — още не е запазено</strong>
      <button type="button" class="btn btn--ghost btn--sm" onclick="tsClosePreview()">✕ Затвори</button>
    </div>
    <div id="preview-content"></div>
    <p class="muted" style="font-size:12px;margin-top:16px;">
      Приблизителен преглед на текущо въведените данни — продуктът все още не е запазен. Затвори и натисни "Запази продукта", когато си готов.
    </p>
  </div>
</div>

<form method="POST" action="/admin/product-form.php<?= $__existing ? '?id=' . urlencode($__existing['id']) : '' ?>" enctype="multipart/form-data">
  <div class="card-box">
    <h3 style="margin-top:0;">Основна информация</h3>
    <div class="form-grid">
      <div class="field">
        <label>Име</label>
        <input type="text" id="pf-name" name="name" value="<?= e($__existing['name'] ?? '') ?>" required>
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
        <select id="pf-category" name="category_id" onchange="tsHandleCategoryChange()" required>
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
        <input type="number" step="0.01" id="pf-price-bgn" name="price_bgn" value="<?= e($__existing['price_bgn'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>Цена (€)</label>
        <input type="number" step="0.01" id="pf-price-eur" name="price_eur" value="<?= e($__existing['price_eur'] ?? '') ?>" required>
      </div>
      <div class="field">
        <label>Материя (състав)</label>
        <input type="text" id="pf-material" name="material" value="<?= e($__existing['material'] ?? '') ?>" list="material-options">
      </div>
      <div class="field">
        <label>Цвят</label>
        <input type="text" id="pf-color" name="color" value="<?= e($__existing['color'] ?? '') ?>" list="color-options">
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
      <textarea id="pf-description" name="description"><?= e($__existing['description'] ?? '') ?></textarea>
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
      <label>Качи снимки от компютъра</label>
      <input type="file" name="image_files[]" accept="image/*" multiple onchange="tsPreviewImageFiles(this)">
      <p class="muted" style="font-size:12px;margin-top:4px;">Може да избереш няколко наведнъж (до 8MB всяка). Добавят се след линковете по-долу.</p>
      <div id="new-image-previews" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>
    </div>
    <div class="field">
      <label>Или линкове (URL) — един на ред, ако предпочиташ да пуснеш линк вместо файл</label>
      <textarea name="image_urls" rows="4"><?= e($__imageUrlsText) ?></textarea>
    </div>
    <?php if ($__existingImages): ?>
      <div class="field">
        <label>Текущи снимки (първата е основната)</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <?php foreach ($__existingImages as $__img): ?>
            <img src="<?= e($__img['url']) ?>" alt="" style="width:60px;height:75px;object-fit:cover;border-radius:4px;background:var(--bg-soft);">
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Таблица за размери</h3>
    <p class="muted" style="font-size:12.5px;margin-top:-6px;margin-bottom:10px;">
      По избор — снимка на таблица с мерки за този продукт. Показва се на клиента на
      продуктовата страница, при клик върху "Как да избера размер?". Ако не качиш нищо,
      там ще се показва общият текст със съвети.
    </p>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <img id="size-chart-thumb" src="<?= e($__existing['size_chart_url'] ?? '') ?>" alt=""
           style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:var(--bg-soft);flex-shrink:0;<?= empty($__existing['size_chart_url']) ? 'display:none;' : '' ?>">
      <input type="text" name="size_chart_url" value="<?= e($__existing['size_chart_url'] ?? '') ?>"
             placeholder="https://... (по избор, ако не качваш файл)" style="flex:1;min-width:160px;"
             oninput="tsSizeChartUrlChange(this)">
      <input type="file" name="size_chart_file" accept="image/*" style="flex:1;min-width:160px;font-size:12.5px;"
             onchange="tsPreviewSizeChartFile(this)">
    </div>
    <div class="field" style="margin-top:12px;">
      <label>Таблица с мерки (по избор) — CSV формат</label>
      <textarea name="size_chart_table" rows="6" placeholder="Размер, Талия (см), Дължина (см)&#10;S, 37, 38&#10;M, 38, 39&#10;L, 40, 39&#10;XL, 42, 40&#10;XXL, 44, 41"><?= e($__existing['size_chart_table'] ?? '') ?></textarea>
      <p class="muted" style="font-size:12px;margin-top:4px;">
        Първи ред = заглавия на колоните, всеки следващ ред = стойности, разделени със запетая
        (както при копиране от Excel/Google Sheets). Показва се като подредена таблица.
        Може да копираш директно от Excel.
      </p>
    </div>
    <div class="field" style="margin-top:12px;">
      <label>Текст с указания за размера (по избор)</label>
      <textarea name="size_chart_note" rows="3" placeholder="напр. Този модел пасва по-плътно — препоръчваме да вземете един размер по-голям."><?= e($__existing['size_chart_note'] ?? '') ?></textarea>
      <p class="muted" style="font-size:12px;margin-top:4px;">
        Показва се над таблицата за размери, при клик върху "Как да избера размер?".
        За качествени бележки (напр. "пасва малко"), не за самите мерки — за тях ползвай
        таблицата по-горе. Различен е за всеки продукт.
      </p>
    </div>
  </div>

  <div class="card-box">
    <h3 style="margin-top:0;">Размери и наличност</h3>
    <p class="muted" style="font-size:12.5px;margin-top:-6px;margin-bottom:10px;">
      Цветът се задава веднъж, горе в "Цвят" на продукта — всички размери тук го наследяват
      автоматично (в тази база всеки продукт е с един цвят; различните цветове на един и същ
      артикул се въвеждат като отделни продукти).
    </p>
    <table class="variant-table">
      <thead><tr><th>Размер</th><th>Наличност (бр.)</th></tr></thead>
      <tbody>
        <?php foreach ($__variantRows as $__v): ?>
          <tr>
            <td><input type="text" name="variant_size[]" value="<?= e($__v['size']) ?>" placeholder="напр. M"></td>
            <td><input type="number" min="0" name="variant_stock[]" value="<?= e((string)$__v['stock']) ?>"></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <p class="muted" style="font-size:12px;">Остави размера празен, за да пропуснеш този ред.</p>
  </div>

  <button type="submit" class="btn">Запази продукта</button>
</form>
<script>
// Shows a thumbnail for each just-picked file before upload, so the admin
// can see which photo they attached instead of just a filename - same
// vanilla-JS pattern as tsSelectSize/tsToggleMobileNav elsewhere on the site.
function tsPreviewImageFiles(input) {
  var box = document.getElementById('new-image-previews');
  box.innerHTML = '';
  var files = input.files || [];
  for (var i = 0; i < files.length; i++) {
    var img = document.createElement('img');
    img.src = URL.createObjectURL(files[i]);
    img.style.cssText = 'width:44px;height:55px;object-fit:cover;border-radius:4px;background:#f2f2f2;';
    box.appendChild(img);
  }
}

// Same thumbnail-preview idea as tsPreviewImageFiles above, just for the
// single size-chart image (URL field or file, whichever the admin uses).
function tsSizeChartThumbShow(src) {
  var thumb = document.getElementById('size-chart-thumb');
  if (!thumb) return;
  if (src) {
    thumb.src = src;
    thumb.style.display = '';
  } else {
    thumb.style.display = 'none';
  }
}
function tsSizeChartUrlChange(input) {
  tsSizeChartThumbShow(input.value.trim());
}
function tsPreviewSizeChartFile(input) {
  var file = input.files && input.files[0];
  if (file) tsSizeChartThumbShow(URL.createObjectURL(file));
}

// "Преглед" - builds a client-only mockup of the product page from whatever
// is currently typed into the form, WITHOUT saving anything (mirrors the
// same feature in the Next.js admin's ProductForm.tsx).
function tsEscHtml(s) {
  var div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}
var TS_BADGE_DEFS = {
  bestseller: { label: 'Бестселър', cls: 'badge--bestseller' },
  'new': { label: 'Нов', cls: 'badge--new' },
  limited: { label: 'Ограничена бройка', cls: 'badge--limited' },
  most_popular: { label: 'Най-търсен', cls: 'badge--popular' }
};
function tsPreviewProduct() {
  var name = document.getElementById('pf-name').value.trim();
  var categorySelect = document.getElementById('pf-category');
  var categoryOpt = categorySelect.options[categorySelect.selectedIndex];
  var categoryName = categoryOpt ? categoryOpt.text.replace(/^(—\s*)+/, '') : '';
  var priceBgn = document.getElementById('pf-price-bgn').value;
  var priceEur = document.getElementById('pf-price-eur').value;
  var material = document.getElementById('pf-material').value.trim();
  var color = document.getElementById('pf-color').value.trim();
  var description = document.getElementById('pf-description').value.trim();

  // Main image: first pasted URL line, else the first newly-picked file.
  var urlsText = document.querySelector('textarea[name="image_urls"]').value.trim();
  var firstUrl = urlsText ? urlsText.split('\n')[0].trim() : '';
  var fileInput = document.querySelector('input[name="image_files[]"]');
  var mainImageSrc = firstUrl;
  if (!mainImageSrc && fileInput.files && fileInput.files[0]) {
    mainImageSrc = URL.createObjectURL(fileInput.files[0]);
  }
  var imgHtml = '<div class="pdp__img-wrap">' + (mainImageSrc
    ? '<img src="' + tsEscHtml(mainImageSrc) + '" class="pdp__img">'
    : '<div class="pdp__img" style="background:#f2f2f2;"></div>') + '</div>';

  var badgesHtml = '';
  document.querySelectorAll('input[name="badges[]"]:checked').forEach(function (cb) {
    var def = TS_BADGE_DEFS[cb.value];
    if (def) badgesHtml += '<span class="badge ' + def.cls + '" style="margin-right:6px;">' + def.label + '</span>';
  });

  var sizesHtml = '';
  var sizeInputs = document.querySelectorAll('input[name="variant_size[]"]');
  var stockInputs = document.querySelectorAll('input[name="variant_stock[]"]');
  sizeInputs.forEach(function (input, i) {
    var size = input.value.trim();
    if (!size) return;
    var stock = parseInt((stockInputs[i] && stockInputs[i].value) || '0', 10);
    sizesHtml += '<span class="opt' + (stock <= 0 ? ' disabled' : '') + '">' + tsEscHtml(size) + '</span>';
  });

  var html = ''
    + '<div class="pdp" style="margin:0;">'
    + '<div>' + imgHtml + '</div>'
    + '<div>'
    + (badgesHtml ? '<div style="margin-bottom:8px;">' + badgesHtml + '</div>' : '')
    + (categoryName ? '<p class="muted" style="font-size:12.5px;margin:0 0 4px;">' + tsEscHtml(categoryName) + '</p>' : '')
    + '<h1 class="pdp__title">' + (name ? tsEscHtml(name) : '(без име)') + '</h1>'
    + '<p class="pdp__price">' + (priceBgn ? tsEscHtml(priceBgn) + ' лв.' : '—') + (priceEur ? '<small>' + tsEscHtml(priceEur) + ' €</small>' : '') + '</p>'
    + '<div class="pdp__meta"><div>Материя: ' + (material ? tsEscHtml(material) : '—') + '</div><div>Цвят: ' + (color ? tsEscHtml(color) : '—') + '</div></div>'
    + (sizesHtml ? '<div style="margin-top:12px;"><p class="opt-label">Размери</p><div style="display:flex;gap:6px;flex-wrap:wrap;">' + sizesHtml + '</div></div>' : '')
    + (description ? '<p style="margin-top:16px;font-size:13.5px;line-height:1.6;">' + tsEscHtml(description) + '</p>' : '')
    + '</div></div>';

  document.getElementById('preview-content').innerHTML = html;
  document.getElementById('product-preview-modal').style.display = 'flex';
}
function tsClosePreview() {
  document.getElementById('product-preview-modal').style.display = 'none';
}

// Swaps the size column between letters and EU pants numbers when the admin
// picks a category - only for a brand-new product, and only while the rows
// are still untouched defaults, so it never clobbers real data. Both lists
// are the same length (9) so this is a simple in-place value rewrite, no
// rows added/removed. Mirrors handleCategoryChange in ProductForm.tsx.
var TS_DEFAULT_SIZES_LETTER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
var TS_DEFAULT_SIZES_NUMERIC = ['44', '46', '48', '50', '52', '54', '56', '58', '60'];
var TS_IS_EXISTING_PRODUCT = <?= $__existing ? 'true' : 'false' ?>;

function tsIsPantsCategoryText(text) {
  var t = (text || '').toLowerCase();
  return t.indexOf('дънк') !== -1 || t.indexOf('панталон') !== -1;
}
function tsRowsMatchPreset(sizeInputs, stockInputs, sizes) {
  if (sizeInputs.length !== sizes.length) return false;
  for (var i = 0; i < sizes.length; i++) {
    if (sizeInputs[i].value.trim() !== sizes[i]) return false;
    if (stockInputs[i] && stockInputs[i].value.trim() !== '') return false;
  }
  return true;
}
function tsHandleCategoryChange() {
  if (TS_IS_EXISTING_PRODUCT) return;
  var select = document.getElementById('pf-category');
  var opt = select.options[select.selectedIndex];
  var targetSizes = tsIsPantsCategoryText(opt ? opt.text : '') ? TS_DEFAULT_SIZES_NUMERIC : TS_DEFAULT_SIZES_LETTER;

  var sizeInputs = document.querySelectorAll('input[name="variant_size[]"]');
  var stockInputs = document.querySelectorAll('input[name="variant_stock[]"]');
  var isDefault = tsRowsMatchPreset(sizeInputs, stockInputs, TS_DEFAULT_SIZES_LETTER)
    || tsRowsMatchPreset(sizeInputs, stockInputs, TS_DEFAULT_SIZES_NUMERIC);
  if (!isDefault) return;

  for (var i = 0; i < sizeInputs.length && i < targetSizes.length; i++) {
    sizeInputs[i].value = targetSizes[i];
  }
}
</script>
<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
