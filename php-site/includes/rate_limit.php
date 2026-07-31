<?php
require_once __DIR__ . '/db.php';

// Brute-force protection for login forms (admin + customer), stored in the
// database rather than in a PHP array in memory - each request on shared
// hosting can be a fresh PHP process, so an in-memory counter would never
// persist between attempts.
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function client_ip(): string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function is_rate_limited(string $key): bool {
    $since = date('Y-m-d H:i:s', time() - RATE_LIMIT_WINDOW_SECONDS);
    $row = db_one(
        'SELECT COUNT(*) AS c FROM login_attempt WHERE `key` = ? AND created_at >= ?',
        [$key, $since]
    );
    return $row && (int)$row['c'] >= RATE_LIMIT_MAX_ATTEMPTS;
}

function record_failed_attempt(string $key): void {
    db_query('INSERT INTO login_attempt (id, `key`) VALUES (?, ?)', [db_id(), $key]);
    // Best-effort cleanup of old rows for this key.
    $since = date('Y-m-d H:i:s', time() - RATE_LIMIT_WINDOW_SECONDS);
    db_query('DELETE FROM login_attempt WHERE `key` = ? AND created_at < ?', [$key, $since]);
}

function clear_attempts(string $key): void {
    db_query('DELETE FROM login_attempt WHERE `key` = ?', [$key]);
}
