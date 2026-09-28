<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$body = Validator::getJsonBody();
$email = strtolower(trim($body['email'] ?? ''));
$password = $body['password'] ?? '';

if (!$email || !$password) {
    Response::error('VALIDATION_ERROR', 'Email and password are required', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('SELECT id, name, email, phone, college_id, password_hash, role, is_active FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    Response::error('INVALID_CREDENTIALS', 'Invalid email or password', 401);
}

if ((int)$user['is_active'] !== 1) {
    Response::error('ACCOUNT_DISABLED', 'Your account has been disabled. Contact admin.', 403);
}

// Generate raw 32 bytes hex token (64 hex chars)
$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);

$ttl = (int)Env::get('AUTH_TOKEN_TTL_HOURS', '12');
$expiresAt = date('Y-m-d H:i:s', strtotime("+{$ttl} hours"));

$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';

// Housekeeping: delete expired tokens
$pdo->exec("DELETE FROM auth_tokens WHERE expires_at <= NOW()");

// Save token
$tokenStmt = $pdo->prepare('
    INSERT INTO auth_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
    VALUES (?, ?, ?, ?, ?)
');
$tokenStmt->execute([$user['id'], $tokenHash, $userAgent, $ipAddress, $expiresAt]);

// Update last login
$upd = $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
$upd->execute([$user['id']]);

Response::ok([
    'token' => $rawToken,
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'college_id' => $user['college_id'],
        'role' => $user['role'],
    ],
    'expires_at' => $expiresAt
]);
