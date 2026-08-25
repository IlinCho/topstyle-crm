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

  <!-- Simple GDPR-style cookie notice - the site currently only uses cookies
       for things strictly necessary to work (cart contents, login sessions),
       no analytics/tracking yet, so a single "Приемам" is enough. Choice is
       remembered in localStorage (mirrors CookieConsent.tsx on the Next.js
       side) so returning visitors don't see it again. -->
  <div class="cookie-consent" id="ts-cookie-consent" style="display:none;">
    <div class="container cookie-consent__inner">
      <p>
        Този сайт използва бисквитки, необходими за пазаруването (количка, вход в акаунт).
        С продължаване на разглеждането се съгласявате с тяхната употреба.
      </p>
      <button type="button" class="btn btn--sm" onclick="tsAcceptCookies()">Приемам</button>
    </div>
  </div>
  <script>
  (function () {
    try {
      if (!localStorage.getItem('ts_cookie_consent')) {
        document.getElementById('ts-cookie-consent').style.display = 'block';
      }
    } catch (e) { /* localStorage unavailable - just skip the banner */ }
  })();
  function tsAcceptCookies() {
    try { localStorage.setItem('ts_cookie_consent', '1'); } catch (e) {}
    document.getElementById('ts-cookie-consent').style.display = 'none';
  }
  </script>
</body>
</html>
