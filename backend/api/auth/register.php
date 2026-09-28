<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$body = Validator::getJsonBody();
$name = trim($body['name'] ?? '');
$email = strtolower(trim($body['email'] ?? ''));
$password = $body['password'] ?? '';
$phone = trim($body['phone'] ?? '') ?: null;
$collegeId = trim($body['college_id'] ?? '') ?: null;

$errors = [];
if (strlen($name) < 2 || strlen($name) > 100) {
    $errors['name'] = 'Name must be between 2 and 100 characters';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    $errors['email'] = 'Valid email address is required (max 150 chars)';
}
if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
    $errors['password'] = 'Password must be at least 8 characters long and include both letters and numbers';
}
if ($phone && !preg_match('/^[0-9]{10}$/', $phone)) {
    $errors['phone'] = 'Phone number must be 10 digits';
}

if (!empty($errors)) {
    Response::error('VALIDATION_ERROR', 'Please correct validation errors', 422, $errors);
}

$pdo = Database::pdo();
$chk = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$chk->execute([$email]);
if ($chk->fetch()) {
    Response::error('EMAIL_EXISTS', 'An account with this email already exists', 409, ['email' => 'Already registered']);
}

$cost = (int)Env::get('BCRYPT_COST', '10');
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $cost]);

$stmt = $pdo->prepare('
    INSERT INTO users (name, email, phone, college_id, password_hash, role, is_active)
    VALUES (?, ?, ?, ?, ?, "student", 1)
');
$stmt->execute([$name, $email, $phone, $collegeId, $hash]);
$id = (int)$pdo->lastInsertId();

Response::ok([
    'id' => $id,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'college_id' => $collegeId,
    'role' => 'student'
], 201);
