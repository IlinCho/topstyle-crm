<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

$pageTitle = 'Доставка и плащане';
require __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding:30px 0 60px;max-width:760px;">
  <h1 class="section-title" style="margin-top:0;">Доставка и плащане</h1>

  <div class="card-box">
    <h2 style="margin-top:0;font-size:16px;">Доставка</h2>
    <p style="line-height:1.7;">
      Изпращаме поръчките с куриер Еконт (до офис) или Спиди (до адрес), обикновено в рамките
      на 24 часа след потвърждение на поръчката. При получаване имаш възможност да прегледаш и
      тестваш артикула преди да платиш.
    </p>
  </div>

  <div class="card-box" style="margin-top:16px;">
    <h2 style="margin-top:0;font-size:16px;">Начини на плащане</h2>
    <p style="line-height:1.7;">
      Наложен платеж (плащане в брой на куриера при получаване) или карта на ПОС терминала на
      куриера при доставка. Не се изисква плащане онлайн предварително.
    </p>
  </div>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
