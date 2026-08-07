<?php
// Category-page filter facets (size / color / material / price) - PHP mirror
// of src/lib/product-filters.ts. Facets are computed from the pre-filter
// product set (everything in the category/subcategory scope), not
// re-narrowed as filters are applied - same deliberate simplification as
// the Next.js version, vs. the original topstyle.bg PrestaShop live-updating
// counts, which isn't worth the extra complexity at this catalog size.

const TS_SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'XXXL'];

// One query for every product in scope instead of N+1 - returns
// [product_id => [variant, variant, ...]].
function fetch_variants_by_product_ids(array $productIds): array {
    if (!$productIds) return [];
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $rows = db_all("SELECT * FROM product_variant WHERE product_id IN ($placeholders)", $productIds);
    $out = [];
    foreach ($rows as $r) {
        $out[$r['product_id']][] = $r;
    }
    return $out;
}

function compute_facets(array $products, array $variantsByProduct): array {
    $sizeCounts = [];
    $colorCounts = [];
    $materialCounts = [];
    $priceMin = null;
    $priceMax = 0;

    foreach ($products as $p) {
        $variants = $variantsByProduct[$p['id']] ?? [];
        $sizes = array_unique(array_filter(array_map(fn($v) => $v['size'], $variants)));
        $colors = array_unique(array_filter(array_map(fn($v) => $v['color'], $variants)));
        foreach ($sizes as $s) { $sizeCounts[$s] = ($sizeCounts[$s] ?? 0) + 1; }
        foreach ($colors as $c) { $colorCounts[$c] = ($colorCounts[$c] ?? 0) + 1; }
        if (!empty($p['material'])) { $materialCounts[$p['material']] = ($materialCounts[$p['material']] ?? 0) + 1; }
        $price = (float)$p['price_bgn'];
        if ($priceMin === null || $price < $priceMin) $priceMin = $price;
        if ($price > $priceMax) $priceMax = $price;
    }

    $toOptions = fn($counts) => array_map(fn($v, $c) => ['value' => $v, 'count' => $c], array_keys($counts), array_values($counts));

    $sizeOptions = $toOptions($sizeCounts);
    usort($sizeOptions, function ($a, $b) {
        $ia = array_search($a['value'], TS_SIZE_ORDER);
        $ib = array_search($b['value'], TS_SIZE_ORDER);
        if ($ia === false && $ib === false) return strcmp($a['value'], $b['value']);
        if ($ia === false) return 1;
        if ($ib === false) return -1;
        return $ia <=> $ib;
    });

    $colorOptions = $toOptions($colorCounts);
    usort($colorOptions, fn($a, $b) => strcmp($a['value'], $b['value']));

    $materialOptions = $toOptions($materialCounts);
    usort($materialOptions, fn($a, $b) => strcmp($a['value'], $b['value']));

    return [
        'sizes' => $sizeOptions,
        'colors' => $colorOptions,
        'materials' => $materialOptions,
        'price_min' => $products ? floor($priceMin) : 0,
        'price_max' => $products ? ceil($priceMax) : 0,
    ];
}

// Within one facet type = OR (e.g. size M or L). Across facet types = AND
// (e.g. size M/L AND color черен) - standard faceted-search semantics.
function apply_product_filters(array $products, array $variantsByProduct, array $filters): array {
    $sizes = $filters['sizes'] ?? [];
    $colors = $filters['colors'] ?? [];
    $materials = $filters['materials'] ?? [];
    $minPrice = $filters['min_price'] ?? null;
    $maxPrice = $filters['max_price'] ?? null;

    return array_values(array_filter($products, function ($p) use ($variantsByProduct, $sizes, $colors, $materials, $minPrice, $maxPrice) {
        $variants = $variantsByProduct[$p['id']] ?? [];

        if ($sizes) {
            $match = false;
            foreach ($variants as $v) { if (in_array($v['size'], $sizes, true)) { $match = true; break; } }
            if (!$match) return false;
        }
        if ($colors) {
            $match = false;
            foreach ($variants as $v) { if (in_array($v['color'], $colors, true)) { $match = true; break; } }
            if (!$match) return false;
        }
        if ($materials && !in_array($p['material'], $materials, true)) return false;
        if ($minPrice !== null && (float)$p['price_bgn'] < $minPrice) return false;
        if ($maxPrice !== null && (float)$p['price_bgn'] > $maxPrice) return false;
        return true;
    }));
}

// PHP's $_GET only collects repeated checkbox values into an array when the
// input name ends in [] (e.g. name="size[]") - this just normalizes
// whatever comes through into a clean string array either way.
function ts_array_param($raw): array {
    if (!$raw) return [];
    if (is_array($raw)) return array_values(array_filter(array_map('trim', $raw), fn($v) => $v !== ''));
    $v = trim((string)$raw);
    return $v === '' ? [] : [$v];
}
