<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = 'Връщане и замяна';
require __DIR__ . '/includes/header.php';
?>
<div class="container">
  <h1 class="section-title" style="margin-top:20px;">Връщане и замяна</h1>
  <div class="card-box mt-24" style="max-width:640px;">
    <p>Имаш право на връщане или замяна до <?= (int)RETURN_WINDOW_DAYS ?> дни от получаването на поръчката.</p>
    <p>Продуктът трябва да е в оригиналното си състояние, с поставени етикети, неносен и неизпран.</p>
    <p>За да заявиш връщане или замяна, свържи се с нас на телефона в контактите.</p>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
