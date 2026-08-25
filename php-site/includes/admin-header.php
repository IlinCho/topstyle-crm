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

// Notification bell count - "seen" is set to true the moment an admin opens
// that specific order's detail page (see admin/orders.php), so this
// naturally drops to 0 as orders get looked at, same as any other
// notification bell.
$__unseenOrderCount = (int)(db_one('SELECT COUNT(*) AS c FROM `order` WHERE seen_by_admin = 0')['c'] ?? 0);
$__abandonedCount = (int)(db_one('SELECT COUNT(*) AS c FROM abandoned_checkout')['c'] ?? 0);
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
    <a href="/admin/homepage.php" class="<?= $__activeNav === 'homepage' ? 'active' : '' ?>">Начална страница</a>
    <a href="/admin/categories.php" class="<?= $__activeNav === 'categories' ? 'active' : '' ?>">Категории</a>
    <a href="/admin/products.php" class="<?= $__activeNav === 'products' ? 'active' : '' ?>">Продукти</a>
    <a href="/admin/orders.php" class="<?= $__activeNav === 'orders' ? 'active' : '' ?>" style="display:flex;align-items:center;gap:8px;">
      Поръчки
      <?php if ($__unseenOrderCount > 0): ?>
        <span title="<?= $__unseenOrderCount ?> нови поръчки" style="background:#e5484d;color:#fff;border-radius:999px;font-size:11px;font-weight:700;padding:1px 7px;line-height:1.5;">🔔 <?= $__unseenOrderCount ?></span>
      <?php endif; ?>
    </a>
    <a href="/admin/reviews.php" class="<?= $__activeNav === 'reviews' ? 'active' : '' ?>">Отзиви</a>
    <a href="/admin/stock-alerts.php" class="<?= $__activeNav === 'stock_alerts' ? 'active' : '' ?>">Известия за наличност</a>
    <a href="/admin/customers.php" class="<?= $__activeNav === 'customers' ? 'active' : '' ?>">Клиенти</a>
    <a href="/admin/legacy-customers.php" class="<?= $__activeNav === 'legacy_customers' ? 'active' : '' ?>">Стари клиенти</a>
    <a href="/admin/abandoned.php" class="<?= $__activeNav === 'abandoned' ? 'active' : '' ?>" style="display:flex;align-items:center;gap:8px;">
      Изоставени поръчки
      <?php if ($__abandonedCount > 0): ?>
        <span title="<?= $__abandonedCount ?> изоставени поръчки" style="background:#f5a623;color:#fff;border-radius:999px;font-size:11px;font-weight:700;padding:1px 7px;line-height:1.5;"><?= $__abandonedCount ?></span>
      <?php endif; ?>
    </a>
    <a href="/admin/change-password.php" class="<?= $__activeNav === 'change_password' ? 'active' : '' ?>">Смени парола</a>
    <a href="/admin/logout.php">Изход</a>
  </aside>
  <main class="admin-main">
