<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

Auth::require(['admin']);
$body = Validator::getJsonBody();
$id = (int)($body['id'] ?? 0);

if ($id <= 0) {
    Response::error('VALIDATION_ERROR', 'Item ID is required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('UPDATE menu_items SET is_active = 0 WHERE id = ?');
$stmt->execute([$id]);

Response::ok(['message' => 'Menu item deleted successfully (soft delete)']);
