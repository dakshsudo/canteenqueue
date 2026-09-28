<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

Auth::require(['admin']);

$from = trim($_GET['from'] ?? date('Y-m-d', strtotime('-30 days')));
$to = trim($_GET['to'] ?? date('Y-m-d'));

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    Response::error('VALIDATION_ERROR', 'Dates must be in YYYY-MM-DD format', 422);
}

$pdo = Database::pdo();
$stmt = $pdo->prepare('
    SELECT token_date as sale_date, COUNT(*) as orders_count, SUM(total_amount) as revenue
    FROM orders
    WHERE status = "Collected" AND token_date BETWEEN ? AND ?
    GROUP BY token_date
    ORDER BY token_date DESC
');
$stmt->execute([$from, $to]);
$rows = $stmt->fetchAll();

$totalOrders = 0;
$totalRevenue = 0.0;
foreach ($rows as &$r) {
    $r['orders_count'] = (int)$r['orders_count'];
    $r['revenue'] = number_format((float)$r['revenue'], 2, '.', '');
    $totalOrders += $r['orders_count'];
    $totalRevenue += (float)$r['revenue'];
}

Response::ok([
    'from' => $from,
    'to' => $to,
    'total_orders' => $totalOrders,
    'total_revenue' => number_format($totalRevenue, 2, '.', ''),
    'daily_sales' => $rows,
]);
