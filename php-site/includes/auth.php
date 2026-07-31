<?php
require_once __DIR__ . '/db.php';

// Admin session, kept deliberately simple (native PHP sessions) so it works
// on any shared host with zero extra libraries. Cookie name is distinct from
// the customer session so an admin and a customer can be logged in at the
// same time in the same browser without colliding.
const ADMIN_SESSION_COOKIE = 'topstyle_admin_session';

function start_admin_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name(ADMIN_SESSION_COOKIE);
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 30, // 30 days
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function create_admin_session(string $adminId, string $email): void {
    start_admin_session();
    session_regenerate_id(true); // prevent session fixation on login
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['admin_email'] = $email;
}

function clear_admin_session(): void {
    start_admin_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(ADMIN_SESSION_COOKIE, '', time() - 42000, $params['path']);
    }
    session_destroy();
}

function get_admin_session(): ?array {
    start_admin_session();
    if (empty($_SESSION['admin_id'])) return null;
    return ['id' => $_SESSION['admin_id'], 'email' => $_SESSION['admin_email']];
}

// Call this at the top of EVERY admin page (not just for display - to
// actually block rendering) and every admin form-handler script.
function require_admin_session(): array {
    $session = get_admin_session();
    if (!$session) {
        redirect_to('/admin/login.php');
    }
    return $session;
}

function verify_admin_credentials(string $email, string $password): ?array {
    $admin = db_one('SELECT * FROM admin_user WHERE email = ?', [$email]);
    if (!$admin) return null;
    if (!password_verify($password, $admin['password_hash'])) return null;
    return $admin;
}
