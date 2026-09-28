<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

Auth::require(['staff', 'admin']);
$tokenNo = (int)($_GET['token_no'] ?? 0);

if ($tokenNo <= 0) {
    Response::error('VALIDATION_ERROR', 'token_no is required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('
    SELECT o.*, u.name as customer_name, u.phone as customer_phone
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.token_date = CURDATE() AND o.token_no = ?
');
$stmt->execute([$tokenNo]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('NOT_FOUND', "No order found for token T-" . sprintf('%03d', $tokenNo) . " today.", 404);
}

$order['token_code'] = sprintf('T-%03d', (int)$order['token_no']);
$itemStmt = $pdo->prepare('SELECT id, menu_item_id, item_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?');
$itemStmt->execute([$order['id']]);
$order['items'] = $itemStmt->fetchAll();

Response::ok($order);
