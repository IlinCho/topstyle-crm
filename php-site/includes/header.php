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
<main class="<?= isset($mainClass) ? e($mainClass) : '' ?>">
