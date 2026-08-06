<?php
// ---------------------------------------------------------------------------
// Fill these in with the values from cPanel -> MySQL Databases (Jump.bg) and
// upload this file as-is next to the rest of the site. Never share this file
// publicly - it holds real credentials.
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

// Real social media links - pulled directly from the live topstyle.bg
// (footer + header), not fabricated.
define('STORE_FACEBOOK_URL', 'https://www.facebook.com/topstyle.bg/');
define('STORE_INSTAGRAM_URL', 'https://www.instagram.com/topstyle.bg/?hl=bg');

// Viber number - same as STORE_PHONE on the original site.
define('STORE_VIBER_PHONE', '0877 968 927');

// Contact email - left empty on purpose: the original site hides its email
// behind Cloudflare email-obfuscation so it couldn't be read automatically.
// Fill this in if you want an email line in the footer.
define('STORE_EMAIL', '');
