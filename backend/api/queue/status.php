<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$pdo = Database::pdo();

// Now serving token (lowest token_no with status Preparing; if none, lowest token_no with Placed)
$prepSt = $pdo->query("SELECT token_no FROM orders WHERE token_date = CURDATE() AND status = 'Preparing' ORDER BY token_no ASC LIMIT 1");
$nowServingToken = $prepSt->fetchColumn();

if ($nowServingToken === false) {
    $placedSt = $pdo->query("SELECT token_no FROM orders WHERE token_date = CURDATE() AND status = 'Placed' ORDER BY token_no ASC LIMIT 1");
    $nowServingToken = $placedSt->fetchColumn();
}

$nowServingCode = $nowServingToken !== false ? sprintf('T-%03d', (int)$nowServingToken) : 'Queue Empty';

// Ready tokens list
$readySt = $pdo->query("SELECT id, token_no FROM orders WHERE token_date = CURDATE() AND status = 'Ready' ORDER BY token_no ASC");
$readyRows = $readySt->fetchAll();
$readyTokens = array_map(fn($r) => [
    'id' => (int)$r['id'],
    'token_no' => (int)$r['token_no'],
    'token_code' => sprintf('T-%03d', (int)$r['token_no'])
], $readyRows);

// Waiting count (Placed + Preparing)
$waitSt = $pdo->query("SELECT COUNT(*) FROM orders WHERE token_date = CURDATE() AND status IN ('Placed', 'Preparing')");
$waitingCount = (int)$waitSt->fetchColumn();

$ordersOpen = Settings::get('orders_open', '1') === '1';

Response::ok([
    'now_serving_token' => $nowServingToken !== false ? (int)$nowServingToken : null,
    'now_serving_code' => $nowServingCode,
    'waiting_count' => $waitingCount,
    'ready_tokens' => $readyTokens,
    'orders_open' => $ordersOpen,
]);
