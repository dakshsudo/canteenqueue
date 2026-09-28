<?php
declare(strict_types=1);

final class OrderService
{
    public static function place(int $userId, array $items, ?string $note): array
    {
        $pdo = Database::pdo();
        
        // Check if canteen is open
        $ordersOpen = Settings::get('orders_open', '1');
        if ($ordersOpen === '0') {
            Response::error('CANTEEN_CLOSED', 'Canteen is currently closed for new orders.', 409);
        }

        if (empty($items)) {
            Response::error('VALIDATION_ERROR', 'Order items cannot be empty.', 422, ['items' => 'Required']);
        }

        // Aggregate quantities for duplicate item ids
        $map = [];
        $totalQty = 0;
        foreach ($items as $it) {
            $id = (int)($it['menu_item_id'] ?? $it['id'] ?? 0);
            $qty = (int)($it['quantity'] ?? 1);
            if ($id <= 0 || $qty <= 0) continue;
            if (!isset($map[$id])) {
                $map[$id] = 0;
            }
            $map[$id] += $qty;
            $totalQty += $qty;
        }

        if (empty($map)) {
            Response::error('VALIDATION_ERROR', 'Invalid item list.', 422);
        }

        $maxItems = (int)Settings::get('max_items_per_order', '15');
        if ($totalQty > $maxItems) {
            Response::error('VALIDATION_ERROR', "Total quantity exceeds maximum allowed ({$maxItems}).", 422);
        }

        $pdo->beginTransaction();
        try {
            $ids = array_keys($map);
            $inClause = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("SELECT id, name, price, prep_time_minutes FROM menu_items WHERE id IN ($inClause) AND is_active = 1 AND is_available = 1");
            $st->execute($ids);
            $dbItems = [];
            foreach ($st->fetchAll() as $r) {
                $dbItems[(int)$r['id']] = $r;
            }

            if (count($dbItems) !== count($ids)) {
                $unavailable = [];
                foreach ($ids as $reqId) {
                    if (!isset($dbItems[$reqId])) {
                        $unavailable[] = "Item #{$reqId}";
                    }
                }
                $pdo->rollBack();
                Response::error('ITEMS_UNAVAILABLE', 'Some requested items are unavailable or sold out: ' . implode(', ', $unavailable), 409);
            }

            $totalAmount = 0.0;
            $maxPrepTime = 0;
            foreach ($map as $id => $qty) {
                $totalAmount += (float)$dbItems[$id]['price'] * $qty;
                $maxPrepTime = max($maxPrepTime, (int)$dbItems[$id]['prep_time_minutes']);
            }

            // Race-free daily token generation
            $pdo->exec("INSERT INTO token_counters (token_date, last_token) VALUES (CURDATE(), 1) ON DUPLICATE KEY UPDATE last_token = last_token + 1");
            $tokenSt = $pdo->query("SELECT last_token FROM token_counters WHERE token_date = CURDATE()");
            $tokenNo = (int)$tokenSt->fetchColumn();

            // Calculate orders ahead
            $aheadSt = $pdo->query("SELECT COUNT(*) FROM orders WHERE token_date = CURDATE() AND status IN ('Placed', 'Preparing')");
            $ordersAhead = (int)$aheadSt->fetchColumn();

            $avgPerOrder = (int)Settings::get('avg_minutes_per_order', '3');
            $estMinutes = ($ordersAhead * $avgPerOrder) + $maxPrepTime;
            $qrCode = bin2hex(random_bytes(16)); // 32 chars hex

            $ins = $pdo->prepare("
                INSERT INTO orders (user_id, token_date, token_no, qr_code, status, total_amount, note, est_ready_at)
                VALUES (?, CURDATE(), ?, ?, 'Placed', ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
            ");
            $ins->execute([$userId, $tokenNo, $qrCode, number_format($totalAmount, 2, '.', ''), $note ? trim($note) : null, $estMinutes]);
            $orderId = (int)$pdo->lastInsertId();

            $itemIns = $pdo->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($map as $id => $qty) {
                $uPrice = (float)$dbItems[$id]['price'];
                $lTotal = $uPrice * $qty;
                $itemIns->execute([$orderId, $id, $dbItems[$id]['name'], number_format($uPrice, 2, '.', ''), $qty, number_format($lTotal, 2, '.', '')]);
            }

            $histIns = $pdo->prepare("
                INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
                VALUES (?, NULL, 'Placed', ?)
            ");
            $histIns->execute([$orderId, $userId]);

            $pdo->commit();

            return [
                'id' => $orderId,
                'token_no' => $tokenNo,
                'token_code' => sprintf('T-%03d', $tokenNo),
                'qr_code' => $qrCode,
                'status' => 'Placed',
                'total_amount' => number_format($totalAmount, 2, '.', ''),
                'est_minutes' => $estMinutes,
                'orders_ahead' => $ordersAhead,
            ];
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
