<?php
declare(strict_types=1);

final class Response
{
    public static function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function ok(mixed $data = null, int $status = 200): never
    {
        self::json(['success' => true, 'data' => $data], $status);
    }

    public static function error(string $code, string $message, int $status = 400, array $fields = []): never
    {
        self::json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => (object)$fields,
            ]
        ], $status);
    }
}
