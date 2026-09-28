<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

Auth::require(['admin']);
$pdo = Database::pdo();

// Today totals
$totSt = $pdo->query("
    SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Collected' THEN total_amount ELSE 0 END), 0) as collected_revenue,
        COALESCE(SUM(CASE WHEN status = 'Placed' THEN 1 ELSE 0 END), 0) as count_placed,
        COALESCE(SUM(CASE WHEN status = 'Preparing' THEN 1 ELSE 0 END), 0) as count_preparing,
        COALESCE(SUM(CASE WHEN status = 'Ready' THEN 1 ELSE 0 END), 0) as count_ready,
        COALESCE(SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END), 0) as count_collected,
        COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) as count_cancelled
    FROM orders
    WHERE token_date = CURDATE()
");
$totals = $totSt->fetch();

// Average wait time for today's collected orders
$waitSt = $pdo->query("
    SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, collected_at)) as avg_wait_minutes
    FROM orders
    WHERE token_date = CURDATE() AND status = 'Collected' AND collected_at IS NOT NULL
");
$avgWait = (float)($waitSt->fetchColumn() ?: 0);

// Top selling items today
$topSt = $pdo->query("
    SELECT oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.line_total) as total_sales
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.token_date = CURDATE() AND o.status != 'Cancelled'
    GROUP BY oi.item_name
    ORDER BY total_qty DESC
    LIMIT 5
");
$topItems = $topSt->fetchAll();

Response::ok([
    'date' => date('Y-m-d'),
    'total_orders' => (int)$totals['total_orders'],
    'total_revenue' => number_format((float)$totals['total_revenue'], 2, '.', ''),
    'collected_revenue' => number_format((float)$totals['collected_revenue'], 2, '.', ''),
    'status_counts' => [
        'Placed' => (int)$totals['count_placed'],
        'Preparing' => (int)$totals['count_preparing'],
        'Ready' => (int)$totals['count_ready'],
        'Collected' => (int)$totals['count_collected'],
        'Cancelled' => (int)$totals['count_cancelled'],
    ],
    'avg_wait_minutes' => round($avgWait, 1),
    'top_items' => $topItems,
]);
