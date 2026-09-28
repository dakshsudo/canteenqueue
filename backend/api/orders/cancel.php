<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$user = Auth::user();
$body = Validator::getJsonBody();
$id = (int)($body['id'] ?? 0);

if ($id <= 0) {
    Response::error('VALIDATION_ERROR', 'Order ID is required', 422);
}

$pdo = Database::pdo();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
    $stmt->execute([$id]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        Response::error('NOT_FOUND', 'Order not found', 404);
    }

    if ($user['role'] === 'student') {
        if ((int)$order['user_id'] !== (int)$user['id']) {
            $pdo->rollBack();
            Response::error('FORBIDDEN', 'You cannot cancel orders belonging to other users', 403);
        }
        if ($order['status'] !== 'Placed') {
            $pdo->rollBack();
            Response::error('INVALID_TRANSITION', 'Students can only cancel orders while status is Placed', 409);
        }
    } else {
        // Staff/Admin can cancel Placed or Preparing orders
        if (!in_array($order['status'], ['Placed', 'Preparing'], true)) {
            $pdo->rollBack();
            Response::error('INVALID_TRANSITION', 'Can only cancel orders with status Placed or Preparing', 409);
        }
    }

    $oldStatus = $order['status'];
    $upd = $pdo->prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?");
    $upd->execute([$id]);

    $hist = $pdo->prepare("INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, 'Cancelled', ?)");
    $hist->execute([$id, $oldStatus, $user['id']]);

    $pdo->commit();
    Response::ok(['id' => $id, 'status' => 'Cancelled']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}
