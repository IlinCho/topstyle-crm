<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/rate_limit.php';

if (get_admin_session()) {
    redirect_to('/admin/index.php');
}

$__error = '';
if (isset($_GET['error']) && $_GET['error'] === 'locked') {
    $__error = 'Твърде много неуспешни опити. Опитай отново след 15 минути.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    $emailKey = 'admin:email:' . mb_strtolower($email);
    $ipKey = 'admin:ip:' . client_ip();

    if (is_rate_limited($emailKey) || is_rate_limited($ipKey)) {
        redirect_to('/admin/login.php?error=locked');
    }

    $admin = verify_admin_credentials($email, $password);
    if ($admin) {
        clear_attempts($emailKey);
        clear_attempts($ipKey);
        create_admin_session($admin['id'], $admin['email']);
        redirect_to('/admin/index.php');
    } else {
        record_failed_attempt($emailKey);
        record_failed_attempt($ipKey);
        $__error = 'Грешен имейл или парола.';
    }
}
?>
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Вход — Админ</title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<div class="login-shell">
  <div class="login-box">
    <h1 style="margin-top:0;font-size:20px;">Административен вход</h1>
    <?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>
    <form method="POST" action="/admin/login.php">
      <div class="field"><label>Имейл</label><input type="email" name="email" required></div>
      <div class="field"><label>Парола</label><input type="password" name="password" required></div>
      <button type="submit" class="btn" style="width:100%;">Вход</button>
    </form>
  </div>
</div>
</body>
</html>
