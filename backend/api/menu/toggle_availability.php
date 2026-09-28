<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

Auth::require(['staff', 'admin']);
$body = Validator::getJsonBody();
$id = (int)($body['id'] ?? 0);
$isAvailable = isset($body['is_available']) ? ((int)$body['is_available'] === 1 ? 1 : 0) : null;

if ($id <= 0 || $isAvailable === null) {
    Response::error('VALIDATION_ERROR', 'Item ID and is_available flag are required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('UPDATE menu_items SET is_available = ? WHERE id = ? AND is_active = 1');
$stmt->execute([$isAvailable, $id]);

$res = $pdo->prepare('SELECT id, name, is_available FROM menu_items WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch());
