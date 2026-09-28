<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    Response::error('METHOD_NOT_ALLOWED', 'Use POST', 405);
}

$user = Auth::require(['student']);
$body = Validator::getJsonBody();

$items = $body['items'] ?? [];
$note = isset($body['note']) ? (string)$body['note'] : null;

$res = OrderService::place((int)$user['id'], $items, $note);
Response::ok($res, 201);
