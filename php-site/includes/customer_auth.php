<?php
require_once __DIR__ . '/db.php';

const CUSTOMER_SESSION_COOKIE = 'topstyle_customer_session';

function start_customer_session(bool $remember = true): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name(CUSTOMER_SESSION_COOKIE);
    session_set_cookie_params([
        'lifetime' => $remember ? 60 * 60 * 24 * 90 : 0, // 90 days, or until browser closes
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function create_customer_session(string $customerId, string $email, bool $remember = true): void {
    start_customer_session($remember);
    session_regenerate_id(true);
    $_SESSION['customer_id'] = $customerId;
    $_SESSION['customer_email'] = $email;
}

function clear_customer_session(): void {
    start_customer_session();
    // Only drop the customer identity, not the whole session - the cart
    // lives in this same session (see includes/cart.php) and must survive
    // logout, exactly like it survives login. Still rotate the session id
    // for basic hygiene on logout.
    unset($_SESSION['customer_id'], $_SESSION['customer_email']);
    session_regenerate_id(true);
}

function get_customer_session(): ?array {
    start_customer_session();
    if (empty($_SESSION['customer_id'])) return null;
    return ['id' => $_SESSION['customer_id'], 'email' => $_SESSION['customer_email']];
}

function get_current_customer(): ?array {
    $session = get_customer_session();
    if (!$session) return null;
    return db_one('SELECT * FROM customer WHERE id = ?', [$session['id']]);
}

function verify_customer_credentials(string $email, string $password): ?array {
    $customer = db_one('SELECT * FROM customer WHERE email = ?', [$email]);
    if (!$customer || $customer['password_hash'] === '') return null;
    if (!password_verify($password, $customer['password_hash'])) return null;
    return $customer;
}

// Registration "claims" an existing guest customer row (created from a past
// guest order, password_hash = '') instead of failing on the unique email
// constraint. Returns null if the email already has a real account.
function register_customer(string $name, string $email, string $password, string $phone): ?array {
    $existing = db_one('SELECT * FROM customer WHERE email = ?', [$email]);
    $hash = password_hash($password, PASSWORD_BCRYPT);

    if ($existing) {
        if ($existing['password_hash'] !== '') return null; // already a real account
        db_query(
            'UPDATE customer SET name = ?, phone = ?, password_hash = ? WHERE id = ?',
            [$name, $phone, $hash, $existing['id']]
        );
        return db_one('SELECT * FROM customer WHERE id = ?', [$existing['id']]);
    }

    $id = db_id();
    db_query(
        'INSERT INTO customer (id, email, name, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
        [$id, $email, $name, $phone, $hash]
    );
    return db_one('SELECT * FROM customer WHERE id = ?', [$id]);
}
