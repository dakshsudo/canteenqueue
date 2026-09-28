<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$user = Auth::user();
$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    Response::error('VALIDATION_ERROR', 'Order ID is required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$id]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('NOT_FOUND', 'Order not found', 404);
}

// Access check: student can only read their own order
if ($user['role'] === 'student' && (int)$order['user_id'] !== (int)$user['id']) {
    Response::error('FORBIDDEN', 'You can only view your own orders', 403);
}

$order['token_code'] = sprintf('T-%03d', (int)$order['token_no']);

// Items
$itemStmt = $pdo->prepare('SELECT id, menu_item_id, item_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?');
$itemStmt->execute([$id]);
$order['items'] = $itemStmt->fetchAll();

// History
$histStmt = $pdo->prepare('
    SELECT h.id, h.old_status, h.new_status, h.changed_at, u.name as changed_by_name
    FROM order_status_history h
    LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.order_id = ?
    ORDER BY h.id ASC
');
$histStmt->execute([$id]);
$order['history'] = $histStmt->fetchAll();

Response::ok($order);
