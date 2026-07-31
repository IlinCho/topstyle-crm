<?php
// Shared admin layout shell. Deliberately calls require_admin_session() here,
// in the ONE place every single admin page must include, rather than trusting
// each page to remember the check itself - this is exactly the class of bug
// that made the original Next.js admin panel briefly unprotected (a session
// check that existed but was never actually enforced). Centralizing it here
// means a future admin page can literally not forget it.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

$__adminSession = require_admin_session();
$__activeNav = $activeNav ?? '';
?><!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= isset($pageTitle) ? e($pageTitle) . ' — Админ' : 'Админ' ?></title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<div class="admin-shell">
  <aside class="admin-sidebar">
    <div class="admin-sidebar__brand"><?= e(STORE_NAME) ?> — CRM</div>
    <a href="/admin/index.php" class="<?= $__activeNav === 'dashboard' ? 'active' : '' ?>">Табло</a>
    <a href="/admin/categories.php" class="<?= $__activeNav === 'categories' ? 'active' : '' ?>">Категории</a>
    <a href="/admin/products.php" class="<?= $__activeNav === 'products' ? 'active' : '' ?>">Продукти</a>
    <a href="/admin/orders.php" class="<?= $__activeNav === 'orders' ? 'active' : '' ?>">Поръчки</a>
    <a href="/admin/reviews.php" class="<?= $__activeNav === 'reviews' ? 'active' : '' ?>">Отзиви</a>
    <a href="/admin/stock-alerts.php" class="<?= $__activeNav === 'stock_alerts' ? 'active' : '' ?>">Известия за наличност</a>
    <a href="/admin/logout.php">Изход</a>
  </aside>
  <main class="admin-main">
