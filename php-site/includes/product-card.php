<?php
/**
 * Reusable product-grid card. Expects $__p (a row from `product`) to already
 * be set in scope by the including page. Looks up its own image + variants.
 */
$__cardImage = db_one(
    'SELECT * FROM product_image WHERE product_id = ? ORDER BY position ASC LIMIT 1',
    [$__p['id']]
);
$__cardBadges = parse_badges($__p['badges'] ?? '');
$__cardVariants = db_all('SELECT * FROM product_variant WHERE product_id = ? ORDER BY size ASC', [$__p['id']]);
?>
<a href="/product.php?slug=<?= urlencode($__p['slug']) ?>" class="card">
  <img src="<?= e($__cardImage ? $__cardImage['url'] : '/assets/placeholder.jpg') ?>" alt="<?= e($__p['name']) ?>" class="card__img" loading="lazy">
  <div class="card__body">
    <?php if ($__cardBadges): ?>
      <div class="card__badges">
        <?php foreach ($__cardBadges as $__bk): $__bdef = badge_defs()[$__bk] ?? null; if (!$__bdef) continue; ?>
          <span class="badge <?= e($__bdef['class']) ?>"><?= e($__bdef['label']) ?></span>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
    <p class="card__name"><?= e($__p['name']) ?></p>
    <p class="card__price">
      <?= format_eur($__p['price_eur']) ?>
    </p>
    <?php if ($__cardVariants): ?>
      <div class="card__sizes">
        <?php foreach ($__cardVariants as $__cv): ?>
          <span class="size-chip<?= ((int)$__cv['stock'] <= 0) ? ' size-chip--out' : '' ?>"><?= e($__cv['size']) ?></span>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</a>
