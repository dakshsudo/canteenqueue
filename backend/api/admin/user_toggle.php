<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$currentUser = Auth::require(['admin']);
$body = Validator::getJsonBody();
$id = (int)($body['id'] ?? 0);
$isActive = isset($body['is_active']) ? ((int)$body['is_active'] === 1 ? 1 : 0) : null;

if ($id <= 0 || $isActive === null) {
    Response::error('VALIDATION_ERROR', 'User ID and is_active are required', 422);
}

if ($id === (int)$currentUser['id']) {
    Response::error('FORBIDDEN', 'Admin cannot disable own account', 403);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('UPDATE users SET is_active = ? WHERE id = ?');
$stmt->execute([$isActive, $id]);

$res = $pdo->prepare('SELECT id, name, email, is_active FROM users WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch());
