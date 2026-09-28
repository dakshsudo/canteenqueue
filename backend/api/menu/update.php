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
    Response::error('VALIDATION_ERROR', 'Item ID required', 422);
}

$pdo = Database::pdo();
$itemChk = $pdo->prepare('SELECT * FROM menu_items WHERE id = ? AND is_active = 1');
$itemChk->execute([$id]);
$current = $itemChk->fetch();

if (!$current) {
    Response::error('NOT_FOUND', 'Menu item not found', 404);
}

$categoryId = isset($body['category_id']) ? (int)$body['category_id'] : (int)$current['category_id'];
$name = isset($body['name']) ? trim($body['name']) : $current['name'];
$description = array_key_exists('description', $body) ? (trim((string)$body['description']) ?: null) : $current['description'];
$price = isset($body['price']) ? (float)$body['price'] : (float)$current['price'];
$isVeg = isset($body['is_veg']) ? ((int)$body['is_veg'] === 1 ? 1 : 0) : (int)$current['is_veg'];
$prepTime = isset($body['prep_time_minutes']) ? (int)$body['prep_time_minutes'] : (int)$current['prep_time_minutes'];
$imageUrl = array_key_exists('image_url', $body) ? (trim((string)$body['image_url']) ?: null) : $current['image_url'];
$isAvailable = isset($body['is_available']) ? ((int)$body['is_available'] === 1 ? 1 : 0) : (int)$current['is_available'];

$stmt = $pdo->prepare('
    UPDATE menu_items
    SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_veg = ?, prep_time_minutes = ?, is_available = ?
    WHERE id = ?
');
$stmt->execute([$categoryId, $name, $description, number_format($price, 2, '.', ''), $imageUrl, $isVeg, $prepTime, $isAvailable, $id]);

$res = $pdo->prepare('SELECT * FROM menu_items WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch());
