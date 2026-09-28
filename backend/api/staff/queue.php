<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

Auth::require(['staff', 'admin']);
$pdo = Database::pdo();

$stmt = $pdo->query("
    SELECT o.id, o.user_id, o.token_date, o.token_no, o.qr_code, o.status, o.total_amount, o.note, o.est_ready_at, o.created_at, u.name as customer_name, u.phone as customer_phone
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.token_date = CURDATE() AND o.status IN ('Placed', 'Preparing', 'Ready')
    ORDER BY o.token_no ASC
");
$orders = $stmt->fetchAll();

foreach ($orders as &$o) {
    $o['token_code'] = sprintf('T-%03d', (int)$o['token_no']);
    $itemStmt = $pdo->prepare('SELECT id, menu_item_id, item_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?');
    $itemStmt->execute([$o['id']]);
    $o['items'] = $itemStmt->fetchAll();
}

Response::ok($orders);
