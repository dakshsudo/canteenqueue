<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Use GET', 405);
}

$pdo = Database::pdo();
$cats = $pdo->query('SELECT id, name, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order, name')->fetchAll();

$stmt = $pdo->prepare('
    SELECT m.id, m.category_id, m.name, m.description, m.price, m.image_url, m.is_veg, m.prep_time_minutes, m.is_available, m.is_active, c.name as category_name
    FROM menu_items m
    JOIN categories c ON c.id = m.category_id
    WHERE m.is_active = 1 AND c.is_active = 1
    ORDER BY m.name
');
$stmt->execute();
$items = $stmt->fetchAll();

foreach ($cats as &$c) {
    $c['items'] = array_values(array_filter($items, fn($i) => (int)$i['category_id'] === (int)$c['id']));
}

Response::ok($cats);
