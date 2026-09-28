<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Cors.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Settings.php';
require_once __DIR__ . '/OrderService.php';

// Load .env
Env::load(__DIR__ . '/../.env');

// Set Timezone
date_default_timezone_set(Env::get('APP_TIMEZONE', 'Asia/Kolkata'));

// Handle CORS for all API endpoints
Cors::handle();

// Error Handler
set_exception_handler(function (Throwable $e) {
    $debug = Env::get('APP_DEBUG', 'true') === 'true';
    $logMsg = sprintf("[%s] Exception: %s in %s:%d\nStack trace:\n%s\n", date('Y-m-d H:i:s'), $e->getMessage(), $e->getFile(), $e->getLine(), $e->getTraceAsString());
    @file_put_contents(__DIR__ . '/../logs/error.log', $logMsg, FILE_APPEND);

    $msg = $debug ? $e->getMessage() : 'An unexpected error occurred. Please try again later.';
    Response::error('SERVER_ERROR', $msg, 500);
});
