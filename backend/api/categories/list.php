<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$stmt = Database::pdo()->query('SELECT id, name, sort_order, is_active FROM categories WHERE is_active = 1 ORDER BY sort_order, name');
$categories = $stmt->fetchAll();
Response::ok($categories);
