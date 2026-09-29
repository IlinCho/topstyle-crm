<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';

// Footer "Бюлетин" form - lives on every page, so this redirects back to
// wherever the visitor actually submitted from (falls back to the homepage
// if the referrer header is missing/stripped) rather than always landing on
// a dedicated confirmation page.
$__referer = $_SERVER['HTTP_REFERER'] ?? '/index.php';
// Strip any existing newsletter_ok/newsletter_error query flags from a
// previous submit so they don't stack up across repeated attempts.
$__referer = preg_replace('/([?&])newsletter_(ok|error)=1&?/', '$1', $__referer);
$__referer = rtrim($__referer, '?&');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('/index.php');
}

$email = trim($_POST['email'] ?? '');
$agreed = isset($_POST['agree']);
$sep = strpos($__referer, '?') === false ? '?' : '&';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$agreed) {
    redirect_to($__referer . $sep . 'newsletter_error=1');
}

db_query(
    'INSERT IGNORE INTO newsletter_subscriber (id, email) VALUES (?, ?)',
    [db_id(), mb_strtolower($email)]
);

redirect_to($__referer . $sep . 'newsletter_ok=1');
