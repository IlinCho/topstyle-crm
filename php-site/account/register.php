<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/customer_auth.php';

if (get_current_customer()) {
    redirect_to('/account/profile.php');
}

$__error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        $__error = 'Моля, попълни име, валиден имейл и парола (минимум 6 символа).';
    } else {
        $customer = register_customer($name, $email, $password, $phone);
        if (!$customer) {
            $__error = 'Вече има регистриран акаунт с този имейл.';
        } else {
            create_customer_session($customer['id'], $customer['email']);
            redirect_to('/account/profile.php');
        }
    }
}

$pageTitle = 'Регистрация';
require __DIR__ . '/../includes/header.php';
?>
<div style="padding:60px 0;display:flex;justify-content:center;">
  <div class="login-box">
    <h1 style="margin-top:0;font-size:20px;">Регистрация</h1>
    <?php if ($__error): ?><p class="error-text"><?= e($__error) ?></p><?php endif; ?>
    <form method="POST" action="/account/register.php">
      <div class="field"><label>Име</label><input type="text" name="name" required></div>
      <div class="field"><label>Имейл</label><input type="email" name="email" required></div>
      <div class="field"><label>Телефон</label><input type="tel" name="phone"></div>
      <div class="field"><label>Парола</label><input type="password" name="password" required minlength="6"></div>
      <button type="submit" class="btn" style="width:100%;">Регистрирай се</button>
    </form>
    <p class="muted mt-24">Вече имаш акаунт? <a href="/account/login.php">Вход</a></p>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
