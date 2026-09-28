<?php
declare(strict_types=1);

final class Cors
{
    public static function handle(): void
    {
        $rawOrigins = Env::get('CORS_ALLOWED_ORIGINS', 'http://localhost:4200,http://127.0.0.1:4200');
        $allowed = array_map('trim', explode(',', $rawOrigins));
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($origin !== '' && (in_array($origin, $allowed, true) || in_array('*', $allowed, true))) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
            header('Access-Control-Max-Age: 600');
        } else if ($origin !== '') {
            // fallback for dev if needed
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
