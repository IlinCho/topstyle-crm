<?php
// ---------------------------------------------------------------------------
// TEMPLATE - copy this file to config.php and fill in the real values there.
// config.php is gitignored (see .gitignore) precisely so that once it holds
// real Jump.bg database credentials and a real SESSION_SECRET, an ordinary
// commit/push in GitHub Desktop can never accidentally include them. This
// file (config.example.php) stays in git as the reference template - it
// must never contain anything but placeholders.
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

// Real-value trust/urgency copy - leave empty ('') to hide a line entirely
// rather than showing a fabricated claim.
define('SAME_DAY_CUTOFF_TIME', '16:00');
define('CUSTOMERS_SERVED_TEXT', 'Над 25 000 доволни клиента');
define('RETURN_WINDOW_DAYS', 14);

// Footer social links - leave empty ('') to hide the icon row entirely
// rather than linking to a profile that doesn't exist yet.
define('FACEBOOK_URL', '');
define('INSTAGRAM_URL', '');
