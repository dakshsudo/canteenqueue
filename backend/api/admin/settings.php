<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = Database::pdo();

if ($method === 'GET') {
    Auth::require(['admin', 'staff', 'student']); // settings are readable by all authenticated users
    $stmt = $pdo->query('SELECT setting_key, setting_value, description FROM settings');
    $rows = $stmt->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[$r['setting_key']] = $r['setting_value'];
    }
    Response::ok([
        'settings' => $map,
        'details' => $rows
    ]);
} else if ($method === 'POST') {
    Auth::require(['admin']);
    $body = Validator::getJsonBody();
    if (empty($body)) {
        Response::error('VALIDATION_ERROR', 'No settings key-value pairs provided', 422);
    }

    $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($body as $key => $val) {
        if (!is_string($key)) continue;
        $stmt->execute([$key, (string)$val]);
    }

    $res = $pdo->query('SELECT setting_key, setting_value FROM settings')->fetchAll();
    $map = [];
    foreach ($res as $r) {
        $map[$r['setting_key']] = $r['setting_value'];
    }
    Response::ok($map);
} else {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET or POST', 405);
}
