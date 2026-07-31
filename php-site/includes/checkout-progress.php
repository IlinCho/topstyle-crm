<?php
/**
 * Renders the 4-step checkout progress bar. Expects $__step (current step,
 * 1-4) and $__maxStep (highest step the user has reached so far, so
 * completed steps become clickable) to already be set by the including page.
 */
$__stepLabels = [1 => 'Лични данни', 2 => 'Доставка', 3 => 'Плащане', 4 => 'Потвърждение'];
?>
<ul class="checkout-progress">
  <?php foreach ($__stepLabels as $__n => $__label):
    $__done = $__n < $__step;
    $__active = $__n === $__step;
    $__clickable = $__done && $__n <= $__maxStep;
    $__class = 'checkout-progress__step';
    if ($__done) $__class .= ' checkout-progress__step--done';
    if ($__active) $__class .= ' checkout-progress__step--active';
    if ($__clickable) $__class .= ' checkout-progress__step--clickable';
  ?>
    <li class="<?= e($__class) ?>">
      <span class="checkout-progress__line"></span>
      <?php if ($__clickable): ?>
        <a href="/checkout.php?step=<?= (int)$__n ?>" class="checkout-progress__dot">&#10003;</a>
      <?php else: ?>
        <span class="checkout-progress__dot"><?= $__done ? '&#10003;' : (int)$__n ?></span>
      <?php endif; ?>
      <span class="checkout-progress__label"><?= e($__label) ?></span>
    </li>
  <?php endforeach; ?>
</ul>
