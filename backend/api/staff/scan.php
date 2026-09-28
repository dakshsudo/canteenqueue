<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$user = Auth::require(['staff', 'admin']);
$body = Validator::getJsonBody();
$qrCode = trim($body['qr_code'] ?? '');

if (strlen($qrCode) !== 32 || !ctype_xdigit($qrCode)) {
    Response::error('VALIDATION_ERROR', 'Invalid QR code format (must be 32 hexadecimal characters)', 422);
}

$pdo = Database::pdo();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE qr_code = ? FOR UPDATE');
    $stmt->execute([$qrCode]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        Response::error('NOT_FOUND', 'QR Code not found in database', 404);
    }

    if ($order['token_date'] !== date('Y-m-d')) {
        $pdo->rollBack();
        Response::error('EXPIRED_ORDER', 'This order is not dated today', 409);
    }

    if ($order['status'] === 'Collected') {
        $pdo->rollBack();
        Response::error('ALREADY_COLLECTED', 'This order has already been collected!', 409);
    }

    if ($order['status'] === 'Cancelled') {
        $pdo->rollBack();
        Response::error('ORDER_CANCELLED', 'This order was cancelled and cannot be fulfilled.', 409);
    }

    if ($order['status'] !== 'Ready') {
        $pdo->rollBack();
        Response::error('NOT_READY_YET', "Order T-" . sprintf('%03d', (int)$order['token_no']) . " is currently '{$order['status']}' and not ready for collection yet.", 409);
    }

    $oldStatus = $order['status'];
    $upd = $pdo->prepare('UPDATE orders SET status = "Collected", collected_at = NOW(), collected_by = ? WHERE id = ?');
    $upd->execute([$user['id'], $order['id']]);

    $hist = $pdo->prepare('INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, "Collected", ?)');
    $hist->execute([$order['id'], $oldStatus, $user['id']]);

    $pdo->commit();

    $itemStmt = $pdo->prepare('SELECT item_name, quantity, unit_price, line_total FROM order_items WHERE order_id = ?');
    $itemStmt->execute([$order['id']]);
    $items = $itemStmt->fetchAll();

    Response::ok([
        'message' => 'Food handed over successfully!',
        'order_id' => (int)$order['id'],
        'token_no' => (int)$order['token_no'],
        'token_code' => sprintf('T-%03d', (int)$order['token_no']),
        'total_amount' => $order['total_amount'],
        'items' => $items,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}
