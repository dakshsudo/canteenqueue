<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

Auth::require(['admin']);
$role = trim($_GET['role'] ?? '');
$query = trim($_GET['q'] ?? '');

$sql = 'SELECT id, name, email, phone, college_id, role, is_active, last_login_at, created_at FROM users WHERE 1=1';
$params = [];

if ($role && in_array($role, ['student', 'staff', 'admin'], true)) {
    $sql .= ' AND role = ?';
    $params[] = $role;
}

if ($query) {
    $sql .= ' AND (name LIKE ? OR email LIKE ? OR college_id LIKE ? OR phone LIKE ?)';
    $searchTerm = "%{$query}%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

$sql .= ' ORDER BY id DESC';

$pdo = Database::pdo();
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

Response::ok($users);
