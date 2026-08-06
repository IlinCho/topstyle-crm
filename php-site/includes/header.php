<?php
// Include order matters: db -> helpers -> customer_auth -> cart.
// Any page that includes header.php gets all of these for free.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/customer_auth.php';
require_once __DIR__ . '/cart.php';

$__customer = get_current_customer();
$__cartCount = cart_count();
$__justAdded = isset($_GET['added']) && $_GET['added'] === '1';

$__allCategories = db_all('SELECT * FROM category ORDER BY position ASC, name ASC');
$__categoryTree = build_category_tree($__allCategories);

$__pageTitle = isset($pageTitle) && $pageTitle !== '' ? $pageTitle . ' — ' . STORE_NAME : STORE_NAME;
?><!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($__pageTitle) ?></title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body class="storefront">
<header class="site-header">
  <div class="container site-header__top" id="site-header-top">
    <div class="header-mobile-controls">
      <button type="button" class="icon-btn" aria-label="Меню" aria-expanded="false" id="mobile-nav-toggle" onclick="tsToggleMobileNav()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <button type="button" class="icon-btn" aria-label="Търсене" aria-expanded="false" id="mobile-search-toggle" onclick="tsToggleMobileSearch()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
    </div>

    <a href="/index.php" class="logo">
      <img src="/assets/logo.svg" alt="<?= e(STORE_NAME) ?>" class="logo__img">
    </a>
    <div class="header-actions">
      <?php if ($__customer): ?>
        <a href="/account/profile.php">Моят акаунт</a>
        <a href="/account/logout.php">Изход</a>
      <?php else: ?>
        <a href="/account/login.php">Вход</a>
      <?php endif; ?>
      <a href="/cart.php" class="cart-pill<?= $__justAdded ? ' cart-pill--bump' : '' ?>">
        Количка (<?= (int)$__cartCount ?>)
      </a>
    </div>

    <form action="/search.php" method="GET" class="mobile-search-bar" id="mobile-search-bar" style="display:none;">
      <input type="text" name="q" placeholder="Търси продукт...">
      <button type="submit" class="btn btn--sm">Търси</button>
    </form>

    <nav class="mobile-nav-panel" id="mobile-nav-panel" style="display:none;">
      <?php foreach ($__categoryTree as $__cat): ?>
        <div class="mobile-nav-panel__item">
          <a href="/category.php?slug=<?= urlencode($__cat['slug']) ?>"><?= e($__cat['name']) ?></a>
          <?php if (!empty($__cat['children'])): ?>
            <div class="mobile-nav-panel__children">
              <?php foreach ($__cat['children'] as $__child): ?>
                <a href="/category.php?slug=<?= urlencode($__child['slug']) ?>"><?= e($__child['name']) ?></a>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </nav>
  </div>
  <nav class="container nav">
    <?php foreach ($__categoryTree as $__cat): ?>
      <div class="nav__item">
        <a href="/category.php?slug=<?= urlencode($__cat['slug']) ?>"><?= e($__cat['name']) ?></a>
        <?php if (!empty($__cat['children'])): ?>
          <div class="nav__dropdown">
            <?php foreach ($__cat['children'] as $__child): ?>
              <a href="/category.php?slug=<?= urlencode($__child['slug']) ?>"><?= e($__child['name']) ?></a>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </div>
    <?php endforeach; ?>
  </nav>
</header>
<script>
// Mobile hamburger/search toggles - plain vanilla JS to match the rest of
// the PHP site's no-build-step approach (same pattern as tsSelectSize etc.
// on product.php).
function tsToggleMobileNav() {
  var panel = document.getElementById('mobile-nav-panel');
  var searchBar = document.getElementById('mobile-search-bar');
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'flex';
  searchBar.style.display = 'none';
  document.getElementById('mobile-nav-toggle').setAttribute('aria-expanded', String(!open));
  document.getElementById('mobile-search-toggle').setAttribute('aria-expanded', 'false');
}
function tsToggleMobileSearch() {
  var panel = document.getElementById('mobile-nav-panel');
  var searchBar = document.getElementById('mobile-search-bar');
  var open = searchBar.style.display !== 'none';
  searchBar.style.display = open ? 'none' : 'flex';
  panel.style.display = 'none';
  document.getElementById('mobile-search-toggle').setAttribute('aria-expanded', String(!open));
  document.getElementById('mobile-nav-toggle').setAttribute('aria-expanded', 'false');
  if (!open) {
    var input = searchBar.querySelector('input[name="q"]');
    if (input) input.focus();
  }
}
</script>
<main class="<?= isset($mainClass) ? e($mainClass) : '' ?>">
