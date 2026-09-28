<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$user = Auth::require(['staff', 'admin']);
$body = Validator::getJsonBody();
$orderId = (int)($body['order_id'] ?? 0);
$newStatus = trim($body['new_status'] ?? '');

$allowedStatuses = ['Preparing', 'Ready', 'Collected', 'Cancelled'];
if ($orderId <= 0 || !in_array($newStatus, $allowedStatuses, true)) {
    Response::error('VALIDATION_ERROR', 'Valid order_id and new_status (Preparing, Ready, Collected, Cancelled) required', 422);
}

$pdo = Database::pdo();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        Response::error('NOT_FOUND', 'Order not found', 404);
    }

    $oldStatus = $order['status'];

    // Enforce transition table rules
    // Placed -> Preparing
    // Preparing -> Ready
    // Ready -> Collected
    // Placed/Preparing -> Cancelled
    $valid = false;
    if ($oldStatus === 'Placed' && in_array($newStatus, ['Preparing', 'Cancelled'], true)) $valid = true;
    if ($oldStatus === 'Preparing' && in_array($newStatus, ['Ready', 'Cancelled'], true)) $valid = true;
    if ($oldStatus === 'Ready' && $newStatus === 'Collected') $valid = true;

    if (!$valid) {
        $pdo->rollBack();
        Response::error('INVALID_TRANSITION', "Cannot transition order status from '{$oldStatus}' to '{$newStatus}'", 409);
    }

    $timeField = '';
    if ($newStatus === 'Preparing') $timeField = ', preparing_at = NOW()';
    if ($newStatus === 'Ready') $timeField = ', ready_at = NOW()';
    if ($newStatus === 'Collected') $timeField = ', collected_at = NOW(), collected_by = ' . (int)$user['id'];

    $updSql = "UPDATE orders SET status = ?" . $timeField . " WHERE id = ?";
    $upd = $pdo->prepare($updSql);
    $upd->execute([$newStatus, $orderId]);

    $hist = $pdo->prepare('INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)');
    $hist->execute([$orderId, $oldStatus, $newStatus, $user['id']]);

    $pdo->commit();

    $res = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $res->execute([$orderId]);
    $updatedOrder = $res->fetch();
    $updatedOrder['token_code'] = sprintf('T-%03d', (int)$updatedOrder['token_no']);

    Response::ok($updatedOrder);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}
