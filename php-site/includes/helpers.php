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
    usort($pinned, fn($a, $b) => (int)$a['category_rank'] <=> (int)$b['category_rank']);
    $rest = array_values(array_filter($naturalOrder, fn($p) => $p['category_rank'] === null));

    $result = $rest;
    foreach ($pinned as $p) {
        $targetIndex = max(0, min((int)$p['category_rank'] - 1, count($result)));
        array_splice($result, $targetIndex, 0, [$p]);
    }
    return $result;
}
