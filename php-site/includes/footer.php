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
        $__fbUrl = (defined('FACEBOOK_URL') && FACEBOOK_URL !== '') ? FACEBOOK_URL : 'https://www.facebook.com/topstyle.bg';
        $__igUrl = (defined('INSTAGRAM_URL') && INSTAGRAM_URL !== '') ? INSTAGRAM_URL : 'https://www.instagram.com/topstyle.bg';
        $__contactEmail = (defined('STORE_EMAIL') && STORE_EMAIL !== '') ? STORE_EMAIL : 'office@topstyle.bg';
      ?>
      <div class="footer__cols footer__cols--4" style="margin-top:28px;">
        <div>
          <p class="footer__col-title footer__col-title--divider">Полезни връзки</p>
          <ul class="footer__bullet-links">
            <li><a href="/account/profile.php">Моят профил</a></li>
            <li><a href="/delivery-payment.php">Доставка и плащане</a></li>
            <li><a href="/returns.php">Връщане и замяна</a></li>
            <li><a href="/sitemap.php">Карта на сайта</a></li>
          </ul>
        </div>

        <div>
          <p class="footer__col-title footer__col-title--divider">Свържете се с нас</p>
          <div class="footer__contact-rows">
            <p class="footer__contact-name">topstyle.bg</p>
            <div class="footer__contact-row"><?= ts_icon_phone() ?> <?= e(STORE_PHONE) ?></div>
            <div class="footer__contact-row"><?= ts_icon_envelope() ?> <?= e($__contactEmail) ?></div>
            <div class="footer__contact-row"><?= ts_icon_phone() ?> Вайбър - <?= e(STORE_PHONE) ?></div>
          </div>
        </div>

        <div>
          <p class="footer__col-title footer__col-title--divider">Последвайте ни</p>
          <div class="footer__social-icons">
            <a href="<?= e($__fbUrl) ?>" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><?= ts_icon_facebook() ?></a>
            <a href="<?= e($__igUrl) ?>" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><?= ts_icon_instagram() ?></a>
          </div>
          <div id="ts-fb-embed" data-page-url="<?= e($__fbUrl) ?>">
            <a href="<?= e($__fbUrl) ?>" target="_blank" rel="noopener noreferrer" class="footer__fb-fallback">Разгледай ни във Facebook &rarr;</a>
          </div>
        </div>

        <div>
          <p class="footer__col-title footer__col-title--divider">Бюлетин</p>
          <form class="newsletter-form-wrap" method="POST" action="/newsletter-subscribe.php">
            <div class="newsletter-form">
              <input type="email" name="email" placeholder="Вашият имейл" required>
              <button type="submit" class="btn" aria-label="Абонирай се">&#9993;</button>
            </div>
            <p class="newsletter-note">
              Можете да се отпишете във всеки момент. За целта моля намерете информацията за контакт с
              нас в правните условия.
            </p>
            <label class="newsletter-consent">
              <input type="checkbox" name="agree" required>
              Съгласен съм с условията и политиката за поверителност
            </label>
            <?php if (isset($_GET['newsletter_ok'])): ?>
              <p class="newsletter-msg newsletter-msg--ok">&#10003; Благодарим, записахме те!</p>
            <?php elseif (isset($_GET['newsletter_error'])): ?>
              <p class="newsletter-msg newsletter-msg--error">Моля, въведи валиден имейл и потвърди съгласието си.</p>
            <?php endif; ?>
          </form>
        </div>
      </div>

      <p class="muted mt-24">&copy; <?= date('Y') ?> <?= e(STORE_NAME) ?>. Всички права запазени. <a href="/admin/login.php" class="footer__admin-link">Админ</a></p>
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
        tsShowFbEmbed();
      }
    } catch (e) { /* localStorage unavailable - just skip the banner */ }
  })();
  function tsAcceptCookies() {
    try { localStorage.setItem('ts_cookie_consent', '1'); } catch (e) {}
    document.getElementById('ts-cookie-consent').style.display = 'none';
    tsLoadTrackers();
    tsShowFbEmbed();
  }

  // The Facebook Page plugin (footer "Последвайте ни" column) is itself a
  // third-party embed that sets FB cookies once loaded - swapped in only
  // after consent, same as the pixel/GA/GTM scripts below, instead of the
  // fallback link that's rendered by default. Mirrors FacebookPageEmbed.tsx.
  function tsShowFbEmbed() {
    var el = document.getElementById('ts-fb-embed');
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    var pageUrl = el.dataset.pageUrl;
    var src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(pageUrl) +
      '&tabs=timeline&width=280&height=130&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false';
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '280';
    iframe.height = '130';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    iframe.loading = 'lazy';
    iframe.allow = 'encrypted-media';
    el.innerHTML = '';
    el.appendChild(iframe);
  }

  // Fires a standard Meta Pixel e-commerce event from any page (product.php,
  // cart.php, checkout.php, order-confirmation.php, ...) - a no-op until the
  // visitor has accepted cookies and tsLoadTrackers() has actually created
  // window.fbq, mirroring fbqTrack() in Analytics.tsx on the Next.js side.
  function tsFbqTrack(event, params) {
    if (typeof fbq === 'function') { fbq('track', event, params); }
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
