<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

Auth::require(['admin']);
$body = Validator::getJsonBody();

$id = isset($body['id']) && (int)$body['id'] > 0 ? (int)$body['id'] : null;
$name = trim($body['name'] ?? '');
$sortOrder = (int)($body['sort_order'] ?? 0);
$isActive = isset($body['is_active']) ? ((int)$body['is_active'] === 1 ? 1 : 0) : 1;

if (!$name) {
    Response::error('VALIDATION_ERROR', 'Category name is required', 422, ['name' => 'Required']);
}

$pdo = Database::pdo();
if ($id) {
    $chk = $pdo->prepare('SELECT id FROM categories WHERE name = ? AND id != ?');
    $chk->execute([$name, $id]);
    if ($chk->fetch()) {
        Response::error('CATEGORY_EXISTS', 'Category with this name already exists', 409);
    }
    $upd = $pdo->prepare('UPDATE categories SET name = ?, sort_order = ?, is_active = ? WHERE id = ?');
    $upd->execute([$name, $sortOrder, $isActive, $id]);
} else {
    $chk = $pdo->prepare('SELECT id FROM categories WHERE name = ?');
    $chk->execute([$name]);
    if ($chk->fetch()) {
        Response::error('CATEGORY_EXISTS', 'Category with this name already exists', 409);
    }
    $ins = $pdo->prepare('INSERT INTO categories (name, sort_order, is_active) VALUES (?, ?, ?)');
    $ins->execute([$name, $sortOrder, $isActive]);
    $id = (int)$pdo->lastInsertId();
}

$res = $pdo->prepare('SELECT id, name, sort_order, is_active FROM categories WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch());
