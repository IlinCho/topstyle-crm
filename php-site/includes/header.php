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
  <div class="container site-header__top">
    <div class="header-mobile-controls">
      <button type="button" class="icon-btn" aria-label="Меню" onclick="tsToggleMobileMenu()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <button type="button" class="icon-btn" aria-label="Търсене" onclick="tsToggleMobileSearch()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
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

    <form action="/search.php" method="get" class="mobile-search-bar" id="ts-mobile-search" style="display:none;">
      <input type="text" name="q" placeholder="Търси продукти...">
      <button type="submit" class="btn">Търси</button>
    </form>

    <nav class="mobile-nav-panel" id="ts-mobile-nav" style="display:none;">
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
// Mobile hamburger/search toggles - plain JS since this page has no client
// framework. Opening one closes the other, matching MobileNav.tsx on the
// Next.js side.
function tsToggleMobileMenu() {
  var nav = document.getElementById('ts-mobile-nav');
  var search = document.getElementById('ts-mobile-search');
  var open = nav.style.display !== 'none';
  nav.style.display = open ? 'none' : 'flex';
  search.style.display = 'none';
}
function tsToggleMobileSearch() {
  var nav = document.getElementById('ts-mobile-nav');
  var search = document.getElementById('ts-mobile-search');
  var open = search.style.display !== 'none';
  search.style.display = open ? 'none' : 'flex';
  nav.style.display = 'none';
}
</script>
<main class="<?= isset($mainClass) ? e($mainClass) : '' ?>">
