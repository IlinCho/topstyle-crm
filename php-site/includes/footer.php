  </main>
  <footer class="site-footer">
    <div class="container">
      <ul class="trust-strip">
        <li><span class="trust-strip__check">&#10003;</span> <?= e(CUSTOMERS_SERVED_TEXT) ?></li>
        <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
        <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
        <li><span class="trust-strip__check">&#10003;</span> Преглед и тест при получаване</li>
      </ul>
      <p class="muted mt-24">&copy; <?= date('Y') ?> <?= e(STORE_NAME) ?>. Всички права запазени. Тел: <?= e(STORE_PHONE) ?></p>
      <p><a href="/admin/login.php" class="footer__admin-link">Администраторски панел</a></p>
    </div>
  </footer>
</body>
</html>
