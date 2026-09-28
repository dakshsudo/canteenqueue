<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$currentUser = Auth::require(['admin']);
$body = Validator::getJsonBody();

$id = isset($body['id']) && (int)$body['id'] > 0 ? (int)$body['id'] : null;
$name = trim($body['name'] ?? '');
$email = strtolower(trim($body['email'] ?? ''));
$role = trim($body['role'] ?? 'staff');
$phone = trim($body['phone'] ?? '') ?: null;
$collegeId = trim($body['college_id'] ?? '') ?: null;
$password = $body['password'] ?? '';
$isActive = isset($body['is_active']) ? ((int)$body['is_active'] === 1 ? 1 : 0) : 1;

$errors = [];
if (strlen($name) < 2) $errors['name'] = 'Name is required (min 2 chars)';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Valid email is required';
if (!in_array($role, ['student', 'staff', 'admin'], true)) $errors['role'] = 'Invalid role';

if (!$id && strlen($password) < 8) {
    $errors['password'] = 'Password must be at least 8 characters for new user';
}

if (!empty($errors)) {
    Response::error('VALIDATION_ERROR', 'Validation failed', 422, $errors);
}

$pdo = Database::pdo();
$cost = (int)Env::get('BCRYPT_COST', '10');

if ($id) {
    // Cannot edit self to disable or change role
    if ($id === (int)$currentUser['id']) {
        if ($role !== 'admin') Response::error('FORBIDDEN', 'Admin cannot demote own account', 403);
        if ($isActive !== 1) Response::error('FORBIDDEN', 'Admin cannot disable own account', 403);
    }

    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $chk->execute([$email, $id]);
    if ($chk->fetch()) Response::error('EMAIL_EXISTS', 'Email is already used by another user', 409);

    if ($password) {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $cost]);
        $upd = $pdo->prepare('UPDATE users SET name = ?, email = ?, role = ?, phone = ?, college_id = ?, is_active = ?, password_hash = ? WHERE id = ?');
        $upd->execute([$name, $email, $role, $phone, $collegeId, $isActive, $hash, $id]);
    } else {
        $upd = $pdo->prepare('UPDATE users SET name = ?, email = ?, role = ?, phone = ?, college_id = ?, is_active = ? WHERE id = ?');
        $upd->execute([$name, $email, $role, $phone, $collegeId, $isActive, $id]);
    }
} else {
    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $chk->execute([$email]);
    if ($chk->fetch()) Response::error('EMAIL_EXISTS', 'Email is already registered', 409);

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $cost]);
    $ins = $pdo->prepare('INSERT INTO users (name, email, role, phone, college_id, is_active, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $ins->execute([$name, $email, $role, $phone, $collegeId, $isActive, $hash]);
    $id = (int)$pdo->lastInsertId();
}

$res = $pdo->prepare('SELECT id, name, email, phone, college_id, role, is_active, created_at FROM users WHERE id = ?');
$res->execute([$id]);
Response::ok($res->fetch());
