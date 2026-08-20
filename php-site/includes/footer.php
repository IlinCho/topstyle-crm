  </main>
  <footer class="site-footer">
    <div class="container">
      <ul class="trust-strip">
        <li><span class="trust-strip__check">&#10003;</span> <?= e(CUSTOMERS_SERVED_TEXT) ?></li>
        <li><span class="trust-strip__check">&#10003;</span> Сигурно връщане до <?= (int)RETURN_WINDOW_DAYS ?> дни</li>
        <li><span class="trust-strip__check">&#10003;</span> Доставка до 24 часа</li>
        <li><span class="trust-strip__check">&#10003;</span> Преглед и тест при получаване</li>
      </ul>

      <?php
        // header.php (included above on every page) already built
        // $__categoryTree - reuse it here instead of re-querying.
        $__footerCats = array_slice($__categoryTree ?? [], 0, 6);
      ?>
      <div class="footer__cols" style="margin-top:28px;">
        <div>
          <p class="footer__col-title"><?= e(STORE_NAME) ?></p>
          <ul class="footer__links">
            <li>Мъжка мода с характер</li>
            <li>Тел: <?= e(STORE_PHONE) ?></li>
          </ul>
        </div>

        <div>
          <p class="footer__col-title">Категории</p>
          <ul class="footer__links">
            <?php foreach ($__footerCats as $__fc): ?>
              <li><a href="/category.php?slug=<?= urlencode($__fc['slug']) ?>"><?= e($__fc['name']) ?></a></li>
            <?php endforeach; ?>
          </ul>
        </div>

        <div>
          <p class="footer__col-title">Информация</p>
          <ul class="footer__links">
            <li><a href="/account/login.php">Вход / Регистрация</a></li>
            <li><a href="/cart.php">Количка</a></li>
            <li><a href="/admin/login.php" class="footer__admin-link">Админ</a></li>
          </ul>
          <?php if (FACEBOOK_URL || INSTAGRAM_URL): ?>
            <div class="footer__social" style="margin-top:12px;">
              <?php if (FACEBOOK_URL): ?>
                <a href="<?= e(FACEBOOK_URL) ?>" target="_blank" rel="noopener noreferrer" class="footer__social-link">Facebook</a>
              <?php endif; ?>
              <?php if (INSTAGRAM_URL): ?>
                <a href="<?= e(INSTAGRAM_URL) ?>" target="_blank" rel="noopener noreferrer" class="footer__social-link">Instagram</a>
              <?php endif; ?>
            </div>
          <?php endif; ?>
        </div>
      </div>

      <p class="muted mt-24">&copy; <?= date('Y') ?> <?= e(STORE_NAME) ?>. Всички права запазени.</p>
    </div>
  </footer>
</body>
</html>
