<?php
// ---------------------------------------------------------------------------
// Fill these in with the values from cPanel -> MySQL Databases (Jump.bg) and
// upload this file as-is next to the rest of the site. Never share this file
// publicly - it holds real credentials.
//
// This exact file is listed in .gitignore, so once you replace the
// placeholders below with real values, git will never pick up or commit the
// change (see config.example.php for the tracked template/reference copy).
// ---------------------------------------------------------------------------

define('DB_HOST', 'localhost');           // almost always 'localhost' on cPanel
define('DB_NAME', 'your_cpanel_dbname');   // e.g. jumpuser_topstyle
define('DB_USER', 'your_cpanel_dbuser');   // e.g. jumpuser_admin
define('DB_PASS', 'your_cpanel_dbpass');

// A long random string used to sign session/login-lockout data. Generate a
// real one (e.g. run `openssl rand -hex 32` or ask Claude for one) and never
// reuse the placeholder below in production.
define('SESSION_SECRET', 'change-this-to-a-real-random-secret');

// Shown in the header/footer and used to build absolute links if ever needed.
define('SITE_URL', 'https://topstyle.bg');
define('STORE_NAME', 'TopStyle.bg');
define('STORE_PHONE', '0877 968 927');

// Order confirmation (to the customer) and new-order alert (to you) emails -
// see includes/mailer.php. Sent via PHP's built-in mail(), no extra service
// needed. STORE_EMAIL is the "From" address customers see; leave it empty to
// fall back to a no-reply@<domain> address built from SITE_URL above.
// ADMIN_NOTIFY_EMAIL is where new-order alerts go - leave empty to disable
// that email entirely (the customer confirmation still sends either way).
define('STORE_EMAIL', '');
define('ADMIN_NOTIFY_EMAIL', '');

// Tracking/marketing snippets (Admin has no UI for these - set the real IDs
// here once you've created the accounts). Each is only injected into the
// page if its constant is non-empty, and only after the visitor accepts the
// cookie banner (see includes/footer.php) - never before.
define('GA_MEASUREMENT_ID', 'G-1KL1E0SYMP');
define('FACEBOOK_PIXEL_ID', '1251055915627451');
define('GTM_CONTAINER_ID', 'GTM-P8QG28WL');
define('CLARITY_PROJECT_ID', 'x5rddts2xs');

// Real-value trust/urgency copy - leave empty ('') to hide a line entirely
// rather than showing a fabricated claim.
define('SAME_DAY_CUTOFF_TIME', '16:00');
define('CUSTOMERS_SERVED_TEXT', 'Над 25 000 доволни клиента');
define('RETURN_WINDOW_DAYS', 14);

// Footer social links - leave empty ('') to hide the icon row entirely
// rather than linking to a profile that doesn't exist yet.
define('FACEBOOK_URL', '');
define('INSTAGRAM_URL', '');
