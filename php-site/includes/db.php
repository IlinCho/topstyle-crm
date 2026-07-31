<?php
require_once __DIR__ . '/../config.php';

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

// Small helper so the rest of the codebase never writes raw SQL string
// concatenation with user input - everything goes through prepared
// statements with bound parameters, which is what actually prevents SQL
// injection (not just "escaping" strings).
function db_query(string $sql, array $params = []): PDOStatement {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function db_one(string $sql, array $params = []): ?array {
    $row = db_query($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function db_all(string $sql, array $params = []): array {
    return db_query($sql, $params)->fetchAll();
}

function db_id(): string {
    // Same shape as Prisma's cuid()-style ids elsewhere in the project -
    // doesn't need to be cuid specifically, just collision-resistant and
    // URL-safe.
    return bin2hex(random_bytes(12));
}
