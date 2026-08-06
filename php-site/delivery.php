<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = 'Доставка и плащане';
require __DIR__ . '/includes/header.php';
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">Доставка и плащане</h1>
  <div class="card-box mt-24" style="max-width:640px;">
    <p>Доставяме до посочен адрес или до офис на куриер в цялата страна.</p>
    <?php if (SAME_DAY_CUTOFF_TIME): ?>
      <p>Поръчки направени до <?= e(SAME_DAY_CUTOFF_TIME) ?> ч. се обработват и изпращат същия ден.</p>
    <?php endif; ?>
    <p>Плащане при доставка (наложен платеж) — плащате в брой на куриера при получаване.</p>
    <p>Можеш да прегледаш и пробваш продукта преди да платиш.</p>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
