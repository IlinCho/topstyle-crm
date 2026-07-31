<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/customer_auth.php';
require_once __DIR__ . '/../includes/rate_limit.php';

if (get_current_customer()) {
    redirect_to('/account/profile.php');
}

$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    $emailKey = 'customer:email:' . mb_strtolower($email);
    $ipKey = 'customer:ip:' . client_ip();

    if (is_rate_limited($emailKey) || is_rate_limited($ipKey)) {
        $__error = 'Твърде много неуспешни опити. Опитай отново след 15 минути.';
    } else {
        $customer = verify_customer_credentials($email, $password);
        if ($customer) {
            clear_attempts($emailKey);
            clear_attempts($ipKey);
            create_customer_session($customer['id'], $customer['email']);
            redirect_to('/account/profile.php');
        } else {
            record_failed_attempt($emailKey);
            record_failed_attempt($ipKey);
            $__error = 'Грешен имейл или парола.';
        }
    }
}

$pageTitle = 'Вход';
require __DIR__ . '/../includes/header.php';
?>
<div style="padding:60px 0;display:flex;justify-content:center;">
  <div class="login-box">
    <h1 style="margin-top:0;font-size:20px;">Вход в акаунта</h1>
    <?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>
    <form method="POST" action="/account/login.php">
      <div class="field">
        <label>Имейл</label>
        <input type="email" name="email" required>
      </div>
      <div class="field">
        <label>Парола</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit" class="btn" style="width:100%;">Вход</button>
    </form>
    <p class="muted mt-24">Нямаш акаунт? <a href="/account/register.php">Регистрирай се</a></p>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
