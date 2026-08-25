<?php
// Closes a real gap: schema.sql seeds a documented default admin login
// (admin@topstyle.bg / ChangeMe123!, see the comment above that INSERT) and
// there was previously no way to change it short of editing the database
// directly. Also no "forgot password" flow, so this is the only in-app way
// to rotate credentials - keep it simple and dependency-free.
$activeNav = 'change_password';
$pageTitle = 'Смени парола';
require __DIR__ . '/../includes/admin-header.php';

$__error = '';
$__success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $__error = 'Невалидна сесия — презареди страницата и опитай отново.';
    } else {
        $currentPassword = (string)($_POST['current_password'] ?? '');
        $newPassword = (string)($_POST['new_password'] ?? '');
        $confirmPassword = (string)($_POST['confirm_password'] ?? '');

        $admin = db_one('SELECT * FROM admin_user WHERE id = ?', [$__adminSession['id']]);

        if (!$admin || !password_verify($currentPassword, $admin['password_hash'])) {
            $__error = 'Текущата парола не е вярна.';
        } elseif (mb_strlen($newPassword, 'UTF-8') < 8) {
            $__error = 'Новата парола трябва да е поне 8 символа.';
        } elseif ($newPassword !== $confirmPassword) {
            $__error = 'Новата парола и потвърждението не съвпадат.';
        } else {
            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            db_query('UPDATE admin_user SET password_hash = ? WHERE id = ?', [$newHash, $admin['id']]);
            $__success = true;
        }
    }
}
?>
<div class="admin-topbar">
  <h1 class="admin-h1">Смени парола</h1>
</div>

<?php if ($__success): ?>
  <div class="card-box" style="background:#e7f6ec;border-color:#bfe6cb;">
    Паролата е сменена успешно.
  </div>
<?php endif; ?>
<?php if ($__error): ?>
  <p class="error-text"><?= e($__error) ?></p>
<?php endif; ?>

<div class="card-box" style="max-width:420px;">
  <p class="muted" style="margin-top:0;font-size:13px;">
    Вход: <strong><?= e($__adminSession['email']) ?></strong>
  </p>
  <form method="POST" action="/admin/change-password.php">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
    <div class="field"><label>Текуща парола</label><input type="password" name="current_password" required autocomplete="current-password"></div>
    <div class="field"><label>Нова парола (мин. 8 символа)</label><input type="password" name="new_password" required minlength="8" autocomplete="new-password"></div>
    <div class="field"><label>Потвърди нова парола</label><input type="password" name="confirm_password" required minlength="8" autocomplete="new-password"></div>
    <button type="submit" class="btn btn--sm">Смени паролата</button>
  </form>
</div>

<?php require __DIR__ . '/../includes/admin-footer.php'; ?>
