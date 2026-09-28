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

  <!-- GDPR-style cookie notice - a single "Приемам" covers both the cookies
       strictly necessary to work (cart, login) and the marketing/analytics
       scripts below (tsLoadTrackers), which only start loading once this is
       accepted - never before. Choice is remembered in localStorage (mirrors
       CookieConsent.tsx on the Next.js side) so returning visitors don't see
       it again. -->
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
      } else {
        tsLoadTrackers();
      }
    } catch (e) { /* localStorage unavailable - just skip the banner */ }
  })();
  function tsAcceptCookies() {
    try { localStorage.setItem('ts_cookie_consent', '1'); } catch (e) {}
    document.getElementById('ts-cookie-consent').style.display = 'none';
    tsLoadTrackers();
  }

  // Marketing/analytics scripts - only loaded once the visitor has accepted
  // the cookie notice above (never before), and only for whichever IDs are
  // actually configured in config.php (empty = that tracker is skipped
  // entirely). Set up the real accounts, then fill in the constants there -
  // no code changes needed after that.
  var tsTrackersLoaded = false;
  function tsLoadTrackers() {
    if (tsTrackersLoaded) return;
    tsTrackersLoaded = true;

    <?php if (defined('GA_MEASUREMENT_ID') && GA_MEASUREMENT_ID !== ''): ?>
    (function () {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=<?= e(GA_MEASUREMENT_ID) ?>';
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', '<?= e(GA_MEASUREMENT_ID) ?>');
    })();
    <?php endif; ?>

    <?php if (defined('FACEBOOK_PIXEL_ID') && FACEBOOK_PIXEL_ID !== ''): ?>
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '<?= e(FACEBOOK_PIXEL_ID) ?>');
    fbq('track', 'PageView');
    <?php endif; ?>

    <?php if (defined('GTM_CONTAINER_ID') && GTM_CONTAINER_ID !== ''): ?>
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', '<?= e(GTM_CONTAINER_ID) ?>');
    <?php endif; ?>

    <?php if (defined('CLARITY_PROJECT_ID') && CLARITY_PROJECT_ID !== ''): ?>
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', '<?= e(CLARITY_PROJECT_ID) ?>');
    <?php endif; ?>
  }
  </script>
</body>
</html>
