<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$user = Auth::require(['student']);
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(50, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$pdo = Database::pdo();
$stmt = $pdo->prepare('
    SELECT id, token_date, token_no, qr_code, status, total_amount, note, est_ready_at, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
');
$stmt->bindValue(1, (int)$user['id'], PDO::PARAM_INT);
$stmt->bindValue(2, $limit, PDO::PARAM_INT);
$stmt->bindValue(3, $offset, PDO::PARAM_INT);
$stmt->execute();
$orders = $stmt->fetchAll();

foreach ($orders as &$o) {
    $o['token_code'] = sprintf('T-%03d', (int)$o['token_no']);
    $itemStmt = $pdo->prepare('SELECT id, menu_item_id, item_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?');
    $itemStmt->execute([$o['id']]);
    $o['items'] = $itemStmt->fetchAll();
}

Response::ok($orders);
