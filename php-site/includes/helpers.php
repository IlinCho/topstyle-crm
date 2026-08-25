<?php

function slugify_basic(string $text): string {
    $map = [
        'а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ж'=>'zh','з'=>'z',
        'и'=>'i','й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o','п'=>'p',
        'р'=>'r','с'=>'s','т'=>'t','у'=>'u','ф'=>'f','х'=>'h','ц'=>'ts','ч'=>'ch',
        'ш'=>'sh','щ'=>'sht','ъ'=>'a','ь'=>'y','ю'=>'yu','я'=>'ya',
    ];
    $lower = mb_strtolower($text, 'UTF-8');
    $translit = strtr($lower, $map);
    $translit = preg_replace('/[^a-z0-9]+/', '-', $translit);
    $translit = trim($translit, '-');
    return $translit !== '' ? $translit : 'item';
}

function format_bgn($amount): string {
    return number_format((float)$amount, 2, '.', ' ') . ' лв.';
}

function format_eur($amount): string {
    return number_format((float)$amount, 2, '.', ' ') . ' €';
}

function e(string $value): string {
    // Shorthand for escaping output - used everywhere user/admin-entered
    // text is printed into HTML, so nothing can inject markup/script.
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function redirect_to(string $path): void {
    header('Location: ' . $path);
    exit;
}

// Category/homepage browse listings hide fully sold-out products, matching
// the old PrestaShop storefront's default behavior (which auto-hides
// out-of-stock active products from category pages). The individual product
// page and search results stay unfiltered - someone with a direct link or
// searching by name/SKU should still be able to find and view it, marked
// "Изчерпан", same as before. Takes an array of product rows (each needing
// just an 'id') and returns only the ones with at least 1 unit in stock
// across their variants.
function filter_in_stock(array $products): array {
    if (!$products) return [];
    $ids = array_column($products, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $rows = db_all(
        "SELECT product_id, SUM(stock) AS total_stock FROM product_variant WHERE product_id IN ($placeholders) GROUP BY product_id",
        $ids
    );
    $stockByProduct = [];
    foreach ($rows as $r) {
        $stockByProduct[$r['product_id']] = (int)$r['total_stock'];
    }
    return array_values(array_filter($products, fn($p) => ($stockByProduct[$p['id']] ?? 0) > 0));
}

// Handles admin file uploads for product photos (a $_FILES[...] sub-array
// from a name="image_files[]" multi-file input). Shared hosting has normal
// persistent disk, so this is just plain move_uploaded_file() - no external
// storage service needed the way the Vercel/Next.js version needs Blob.
// Returns the public URLs to store in product_image.url, same shape as a
// pasted external link.
function save_uploaded_product_images(array $filesInput): array {
    $urls = [];
    if (empty($filesInput['name']) || !is_array($filesInput['name'])) return $urls;

    $uploadDir = __DIR__ . '/../uploads/products/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $maxBytes = 8 * 1024 * 1024; // 8MB per photo - generous for a phone photo, still sane

    $count = count($filesInput['name']);
    for ($i = 0; $i < $count; $i++) {
        if (($filesInput['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
        $size = (int)($filesInput['size'][$i] ?? 0);
        if ($size <= 0 || $size > $maxBytes) continue;

        $tmpPath = $filesInput['tmp_name'][$i];
        // getimagesize() actually reads the file's image header, unlike the
        // client-supplied MIME type/extension in $_FILES - both trivially
        // fakeable, so a renamed .php file can't sneak through as a "photo".
        $info = @getimagesize($tmpPath);
        if (!$info) continue;

        $ext = image_type_to_extension($info[2], false); // e.g. 'jpeg', 'png'
        $ext = $ext === 'jpeg' ? 'jpg' : $ext;
        if (!in_array($ext, $allowedExt, true)) continue;

        $filename = bin2hex(random_bytes(8)) . '.' . $ext;
        if (move_uploaded_file($tmpPath, $uploadDir . $filename)) {
            $urls[] = '/uploads/products/' . $filename;
        }
    }
    return $urls;
}

// Single-file counterpart to save_uploaded_product_images() above, for the
// size-chart upload (one file, not a repeatable list) - same validation
// rules (real image content via getimagesize(), 8MB cap, random filename),
// just working off a plain $_FILES[...] entry (scalar fields) instead of
// the array-shaped one a multi[] input produces.
function save_uploaded_size_chart_image(array $fileInput): ?string {
    if (($fileInput['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
    $size = (int)($fileInput['size'] ?? 0);
    $maxBytes = 8 * 1024 * 1024;
    if ($size <= 0 || $size > $maxBytes) return null;

    $tmpPath = $fileInput['tmp_name'] ?? '';
    $info = @getimagesize($tmpPath);
    if (!$info) return null;

    $ext = image_type_to_extension($info[2], false);
    $ext = $ext === 'jpeg' ? 'jpg' : $ext;
    $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowedExt, true)) return null;

    $uploadDir = __DIR__ . '/../uploads/size-charts/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $filename = bin2hex(random_bytes(8)) . '.' . $ext;
    if (move_uploaded_file($tmpPath, $uploadDir . $filename)) {
        return '/uploads/size-charts/' . $filename;
    }
    return null;
}

// Single-file uploader for a homepage category tile image (Admin -> Начална
// страница) - same validation rules as the other upload helpers above (real
// image content via getimagesize(), 8MB cap, random filename). The tile
// itself is always displayed square via CSS (aspect-ratio: 1/1 + object-fit:
// cover on .category-tile), so there's no cropping to do here - any photo
// shape works.
function save_uploaded_category_tile_image(array $fileInput): ?string {
    if (($fileInput['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
    $size = (int)($fileInput['size'] ?? 0);
    $maxBytes = 8 * 1024 * 1024;
    if ($size <= 0 || $size > $maxBytes) return null;

    $tmpPath = $fileInput['tmp_name'] ?? '';
    $info = @getimagesize($tmpPath);
    if (!$info) return null;

    $ext = image_type_to_extension($info[2], false);
    $ext = $ext === 'jpeg' ? 'jpg' : $ext;
    $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowedExt, true)) return null;

    $uploadDir = __DIR__ . '/../uploads/category-tiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $filename = bin2hex(random_bytes(8)) . '.' . $ext;
    if (move_uploaded_file($tmpPath, $uploadDir . $filename)) {
        return '/uploads/category-tiles/' . $filename;
    }
    return null;
}

// Parses an admin-entered CSV size table into a 2D array for rendering as a
// real HTML <table> - first line is treated as the header row, every other
// line as a data row, cells split on commas and trimmed. Deliberately no CSV
// library/quoting support: the data is short numeric measurement rows (e.g.
// "S, 37, 38"), so a plain explode() is enough and keeps this dependency-free
// on shared hosting. Blank lines are skipped so trailing newlines don't
// produce an empty row.
function parse_size_chart_csv(string $raw): array {
    $lines = array_values(array_filter(array_map('trim', explode("\n", $raw)), fn($l) => $l !== ''));
    return array_map(fn($line) => array_map('trim', explode(',', $line)), $lines);
}

// ---- Legacy customers (old PrestaShop store) ----

// Normalizes an email for matching against legacy_customer rows - just
// lowercase + trim, since that's the only variance real customers produce.
function normalize_email(string $email): string {
    return mb_strtolower(trim($email), 'UTF-8');
}

// Normalizes a phone number for matching by keeping only digits and taking
// the last 9 - Bulgarian mobile numbers are 9 digits after the leading
// 0/+359/00359, so "0888123456", "+359888123456" and "00359888123456" all
// collapse to the same "888123456" tail regardless of prefix style.
function normalize_phone(string $phone): string {
    $digits = preg_replace('/\D/', '', $phone);
    return substr($digits, -9);
}

// Checks whether an email/phone pair matches any row imported from the old
// PrestaShop store (Admin -> Стари клиенти). Either field alone is enough to
// match - a customer might have used a different email at checkout but the
// same phone number, or vice versa.
function check_is_legacy(string $email, string $phone): bool {
    $normEmail = normalize_email($email);
    $normPhone = normalize_phone($phone);
    if ($normEmail === '' && $normPhone === '') return false;

    if ($normEmail !== '' && $normPhone !== '') {
        $row = db_one('SELECT id FROM legacy_customer WHERE email = ? OR phone = ? LIMIT 1', [$normEmail, $normPhone]);
    } elseif ($normEmail !== '') {
        $row = db_one('SELECT id FROM legacy_customer WHERE email = ? LIMIT 1', [$normEmail]);
    } else {
        $row = db_one('SELECT id FROM legacy_customer WHERE phone = ? LIMIT 1', [$normPhone]);
    }
    return $row !== null;
}

// ---- Repeat customers (2+ orders on the NEW site) ----
// Different signal from check_is_legacy() above: that one is imported from
// the old PrestaShop store, this one is computed live from the order table
// itself and just means "we've seen this email/phone on more than one order
// here". Builds a normalized email/phone -> order-count index in one query,
// so admin/orders.php can flag every row without a query per row.
function build_repeat_index(): array {
    $rows = db_all('SELECT guest_email, guest_phone FROM `order`', []);
    $emailCounts = [];
    $phoneCounts = [];
    foreach ($rows as $row) {
        $e = normalize_email($row['guest_email'] ?? '');
        $p = normalize_phone($row['guest_phone'] ?? '');
        if ($e !== '') $emailCounts[$e] = ($emailCounts[$e] ?? 0) + 1;
        if ($p !== '') $phoneCounts[$p] = ($phoneCounts[$p] ?? 0) + 1;
    }
    return ['email' => $emailCounts, 'phone' => $phoneCounts];
}

function is_repeat_in_index(array $index, string $email, string $phone): bool {
    $e = normalize_email($email);
    $p = normalize_phone($phone);
    if ($e !== '' && ($index['email'][$e] ?? 0) > 1) return true;
    if ($p !== '' && ($index['phone'][$p] ?? 0) > 1) return true;
    return false;
}

// Single, prioritized "customer status" for an order - collapses the 3
// separate signals (registered account, PrestaShop-migration legacy match,
// repeat-in-new-system match) into ONE label for compact display (the main
// admin dashboard's recent-orders table). The full breakdown as 3 separate
// columns still lives on admin/orders.php - this is just a summary.
// Returns ['key' => 'registered'|'old'|'new', 'label' => ..., 'icon' => ..., 'pillClass' => ...].
function get_customer_status(bool $isLegacy, bool $isRepeat, bool $hasAccount): array {
    if ($hasAccount) {
        return ['key' => 'registered', 'label' => 'Регистриран', 'icon' => '', 'pillClass' => 'pill pill--ok'];
    }
    if ($isLegacy || $isRepeat) {
        return ['key' => 'old', 'label' => 'Стар клиент', 'icon' => '🕐 ', 'pillClass' => 'pill pill--info'];
    }
    return ['key' => 'new', 'label' => 'Нов клиент', 'icon' => '✨ ', 'pillClass' => 'pill pill--ok'];
}

// ---- Abandoned checkout tracking ----
// Captures a checkout that was started (name/email/phone entered) but never
// finished, so the admin can see and follow up on likely-lost sales - see
// admin/abandoned.php. Called from checkout.php right after each step is
// saved into $_SESSION['checkout']. Requires includes/cart.php to already be
// loaded (for cart_line_items()/cart_totals()) - checkout.php always does.
function save_abandoned_checkout_snapshot(array $personal, string $city, int $step): void {
    $name = trim($personal['name'] ?? '');
    $email = trim($personal['email'] ?? '');
    $phone = trim($personal['phone'] ?? '');
    // Nothing worth recording yet - don't create a row for a checkout page
    // visit where the customer hasn't typed anything identifying.
    if ($name === '' && $email === '' && $phone === '') return;

    if (empty($_SESSION['checkout']['client_key'])) {
        $_SESSION['checkout']['client_key'] = bin2hex(random_bytes(16));
    }
    $clientKey = $_SESSION['checkout']['client_key'];

    $lines = cart_line_items();
    $totals = cart_totals($lines);
    $items = array_map(function ($l) {
        return [
            'name' => $l['product']['name'],
            'size' => $l['size'],
            'color' => $l['color'],
            'qty' => $l['qty'],
            'priceBgn' => (float)$l['product']['price_bgn'],
        ];
    }, $lines);

    db_query(
        'INSERT INTO abandoned_checkout (id, client_key, name, email, phone, city, step, items_json, total_bgn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), phone=VALUES(phone),
             city=VALUES(city), step=VALUES(step), items_json=VALUES(items_json), total_bgn=VALUES(total_bgn)',
        [db_id(), $clientKey, $name, $email, $phone, $city, max(1, min(3, $step)), json_encode($items), $totals['bgn']]
    );
}

// Called once a real order is placed with the same session - the checkout is
// no longer "abandoned", so the snapshot row is dropped.
function delete_abandoned_checkout_snapshot(): void {
    if (!empty($_SESSION['checkout']['client_key'])) {
        db_query('DELETE FROM abandoned_checkout WHERE client_key = ?', [$_SESSION['checkout']['client_key']]);
    }
}

// ---- Product badges (Bestseller / New / Limited / Most Popular) ----
// Always set manually from the admin panel - never inferred from sales data,
// so the storefront never shows a claim the admin didn't explicitly choose.
function badge_defs(): array {
    return [
        'bestseller'   => ['label' => 'Бестселър',      'class' => 'badge--bestseller'],
        'new'          => ['label' => 'Нов',            'class' => 'badge--new'],
        'limited'      => ['label' => 'Ограничена бройка', 'class' => 'badge--limited'],
        'most_popular' => ['label' => 'Най-търсен',     'class' => 'badge--popular'],
    ];
}

function parse_badges(string $csv): array {
    if (trim($csv) === '') return [];
    $defs = badge_defs();
    $keys = array_map('trim', explode(',', $csv));
    return array_values(array_filter($keys, fn($k) => isset($defs[$k])));
}

function serialize_badges(array $keys): string {
    $defs = badge_defs();
    $valid = array_values(array_filter($keys, fn($k) => isset($defs[$k])));
    return implode(',', $valid);
}

// ---- Category tree (one level of subcategories) ----
function build_category_tree(array $categories): array {
    $byId = [];
    foreach ($categories as $c) {
        $c['children'] = [];
        $byId[$c['id']] = $c;
    }
    $roots = [];
    foreach ($byId as $id => $c) {
        if (!empty($c['parent_id']) && isset($byId[$c['parent_id']])) {
            $byId[$c['parent_id']]['children'][] = &$byId[$id];
        } else {
            $roots[] = &$byId[$id];
        }
    }
    usort($roots, fn($a, $b) => $a['position'] <=> $b['position']);
    foreach ($roots as &$r) {
        usort($r['children'], fn($a, $b) => $a['position'] <=> $b['position']);
    }
    return $roots;
}

function flatten_category_tree(array $tree, int $depth = 0): array {
    $out = [];
    foreach ($tree as $node) {
        $children = $node['children'] ?? [];
        unset($node['children']);
        $node['depth'] = $depth;
        $out[] = $node;
        $out = array_merge($out, flatten_category_tree($children, $depth + 1));
    }
    return $out;
}

// Collects a category's own id plus its direct children's ids - so a parent
// category page can also show its subcategories' products.
function category_and_descendant_ids(array $category, array $all): array {
    $ids = [$category['id']];
    foreach ($all as $c) {
        if (($c['parent_id'] ?? null) === $category['id']) {
            $ids[] = $c['id'];
        }
    }
    return $ids;
}

// Clamps the admin's "show this as position N" input to 1-8 (the number of
// pin slots the category grid actually has room for), or null if left blank.
function parse_category_rank($raw): ?int {
    $v = trim((string)$raw);
    if ($v === '') return null;
    $n = (int)$v;
    if ($n < 1) $n = 1;
    if ($n > 8) $n = 8;
    return $n;
}

// ---- Admin-pinned product ordering within a category ----
// See the equivalent src/lib/product-order.ts in the Next.js version for the
// full reasoning: a plain SQL ORDER BY can't "make room" for a pinned item,
// so pins are spliced into the natural (newest-first) order in PHP instead.
function apply_category_rank_pins(array $naturalOrder): array {
    $pinned = array_values(array_filter($naturalOrder, fn($p) => $p['category_rank'] !== null));
    usort($pinned, function ($a, $b) {
        $rankDiff = (int)$a['category_rank'] <=> (int)$b['category_rank'];
        if ($rankDiff !== 0) return $rankDiff;
        // Two products pinned to the same slot (e.g. an admin sets a new
        // product to "1" while an older product already sits there) - the
        // one edited most recently should win that exact slot, bumping the
        // other one down by one instead of the other way around. The splice
        // loop below always lands whichever item is processed LAST exactly
        // on the target index, so the most-recently-edited item needs to
        // sort last here (ascending by updated_at).
        return strtotime($a['updated_at']) <=> strtotime($b['updated_at']);
    });
    $rest = array_values(array_filter($naturalOrder, fn($p) => $p['category_rank'] === null));

    $result = $rest;
    foreach ($pinned as $p) {
        $targetIndex = max(0, min((int)$p['category_rank'] - 1, count($result)));
        array_splice($result, $targetIndex, 0, [$p]);
    }
    return $result;
}
