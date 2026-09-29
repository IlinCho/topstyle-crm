<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = 'Карта на сайта';
require __DIR__ . '/includes/header.php';

$__allCategories = db_all('SELECT * FROM category ORDER BY position ASC, name ASC');
$__tree = build_category_tree($__allCategories);
?>
<div class="container" style="padding:30px 0 60px;max-width:760px;">
  <h1 class="section-title" style="margin-top:0;">Карта на сайта</h1>

  <div class="card-box">
    <p class="footer__col-title" style="margin-top:0;">Категории</p>
    <ul class="footer__links">
      <?php foreach ($__tree as $__c): ?>
        <li>
          <a href="/category.php?slug=<?= urlencode($__c['slug']) ?>"><?= e($__c['name']) ?></a>
          <?php if (!empty($__c['children'])): ?>
            <ul class="footer__links" style="margin-top:8px;margin-left:16px;">
              <?php foreach ($__c['children'] as $__sub): ?>
                <li><a href="/category.php?slug=<?= urlencode($__sub['slug']) ?>"><?= e($__sub['name']) ?></a></li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>

  <div class="card-box" style="margin-top:16px;">
    <p class="footer__col-title" style="margin-top:0;">Страници</p>
    <ul class="footer__links">
      <li><a href="/index.php">Начало</a></li>
      <li><a href="/search.php">Търсене</a></li>
      <li><a href="/cart.php">Количка</a></li>
      <li><a href="/account/profile.php">Моят профил</a></li>
      <li><a href="/delivery-payment.php">Доставка и плащане</a></li>
      <li><a href="/returns.php">Връщане и замяна</a></li>
    </ul>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
