<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = 'Връщане и замяна';
require __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding:30px 0 60px;max-width:760px;">
  <h1 class="section-title" style="margin-top:0;">Връщане и замяна</h1>

  <div class="card-box">
    <p style="line-height:1.7;margin-top:0;">
      Разполагаш с <?= (int)RETURN_WINDOW_DAYS ?> дни от получаването на пратката, за да я
      върнеш или замениш, ако размерът не е този, или артикулът не отговаря на очакванията ти.
    </p>
    <p style="line-height:1.7;">
      Артикулът трябва да е в оригиналното си състояние, с поставени етикети, неносен извън
      преглед за размер. За да заявиш връщане или замяна, се свържи с нас на телефона в
      контактите — ще ти обясним следващите стъпки.
    </p>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
