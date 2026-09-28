<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

Auth::require(['admin']);
$body = Validator::getJsonBody();

$categoryId = (int)($body['category_id'] ?? 0);
$name = trim($body['name'] ?? '');
$description = trim($body['description'] ?? '') ?: null;
$price = (float)($body['price'] ?? -1);
$isVeg = isset($body['is_veg']) ? ((int)$body['is_veg'] === 1 ? 1 : 0) : 1;
$prepTime = (int)($body['prep_time_minutes'] ?? 5);
$imageUrl = trim($body['image_url'] ?? '') ?: null;

$errors = [];
if ($categoryId <= 0) $errors['category_id'] = 'Valid category is required';
if (!$name) $errors['name'] = 'Item name is required';
if ($price < 0 || $price > 9999.99) $errors['price'] = 'Price must be between 0 and 9999.99';
if ($prepTime < 1 || $prepTime > 120) $errors['prep_time_minutes'] = 'Prep time must be between 1 and 120 minutes';

if (!empty($errors)) {
    Response::error('VALIDATION_ERROR', 'Validation failed', 422, $errors);
}

$pdo = Database::pdo();
$catChk = $pdo->prepare('SELECT id FROM categories WHERE id = ? AND is_active = 1');
$catChk->execute([$categoryId]);
if (!$catChk->fetch()) {
    Response::error('CATEGORY_NOT_FOUND', 'Selected category does not exist', 404);
}

$stmt = $pdo->prepare('
    INSERT INTO menu_items (category_id, name, description, price, image_url, is_veg, prep_time_minutes, is_available, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
');
$stmt->execute([$categoryId, $name, $description, number_format($price, 2, '.', ''), $imageUrl, $isVeg, $prepTime]);
$id = (int)$pdo->lastInsertId();

$res = $pdo->prepare('SELECT * FROM menu_items WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch(), 201);
