<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$user = Auth::require(['student']);
$orderId = (int)($_GET['order_id'] ?? 0);

if ($orderId <= 0) {
    Response::error('VALIDATION_ERROR', 'order_id parameter is required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('NOT_FOUND', 'Order not found', 404);
}

if ((int)$order['user_id'] !== (int)$user['id']) {
    Response::error('FORBIDDEN', 'You may only track your own order', 403);
}

// Calculate orders ahead
$aheadSt = $pdo->prepare("
    SELECT COUNT(*) FROM orders
    WHERE token_date = ? AND token_no < ? AND status IN ('Placed', 'Preparing')
");
$aheadSt->execute([$order['token_date'], $order['token_no']]);
$ordersAhead = (int)$aheadSt->fetchColumn();

// Get max prep time for this order
$prepSt = $pdo->prepare("
    SELECT MAX(m.prep_time_minutes)
    FROM order_items oi
    JOIN menu_items m ON m.id = oi.menu_item_id
    WHERE oi.order_id = ?
");
$prepSt->execute([$orderId]);
$maxPrep = (int)($prepSt->fetchColumn() ?: 5);

$avgPerOrder = (int)Settings::get('avg_minutes_per_order', '3');
$estMinutes = ($ordersAhead * $avgPerOrder) + $maxPrep;

// Get now serving token
$nsSt = $pdo->query("SELECT token_no FROM orders WHERE token_date = CURDATE() AND status = 'Preparing' ORDER BY token_no ASC LIMIT 1");
$nowServingToken = $nsSt->fetchColumn();
if ($nowServingToken === false) {
    $nsSt = $pdo->query("SELECT token_no FROM orders WHERE token_date = CURDATE() AND status = 'Placed' ORDER BY token_no ASC LIMIT 1");
    $nowServingToken = $nsSt->fetchColumn();
}

$order['token_code'] = sprintf('T-%03d', (int)$order['token_no']);

Response::ok([
    'order' => $order,
    'status' => $order['status'],
    'token_no' => (int)$order['token_no'],
    'token_code' => sprintf('T-%03d', (int)$order['token_no']),
    'qr_code' => $order['qr_code'],
    'orders_ahead' => $ordersAhead,
    'est_minutes' => $estMinutes,
    'now_serving' => $nowServingToken !== false ? sprintf('T-%03d', (int)$nowServingToken) : 'Queue Empty',
]);
