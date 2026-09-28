<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/^Bearer\s+([a-f0-9]{64})$/i', trim($h), $m)) {
    $tokenHash = hash('sha256', $m[1]);
    $stmt = Database::pdo()->prepare('DELETE FROM auth_tokens WHERE token_hash = ?');
    $stmt->execute([$tokenHash]);
}

Response::ok(['message' => 'Logged out successfully']);
