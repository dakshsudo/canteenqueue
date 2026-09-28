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
    Response::error('VALIDATION_ERROR', 'Valid category ID required', 422);
}

$pdo = Database::pdo();
$chk = $pdo->prepare('SELECT COUNT(*) FROM menu_items WHERE category_id = ? AND is_active = 1');
$chk->execute([$id]);
if ((int)$chk->fetchColumn() > 0) {
    Response::error('CATEGORY_HAS_ITEMS', 'Cannot delete category that still contains active menu items.', 409);
}

$upd = $pdo->prepare('UPDATE categories SET is_active = 0 WHERE id = ?');
$upd->execute([$id]);
Response::ok(['message' => 'Category deleted successfully']);
