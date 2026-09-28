<?php
declare(strict_types=1);

final class Auth
{
    public static function user(): array
    {
        $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+([a-f0-9]{64})$/i', trim($h), $m)) {
            Response::error('UNAUTHENTICATED', 'Please log in to proceed.', 401);
        }

        $tokenHash = hash('sha256', $m[1]);
        $st = Database::pdo()->prepare('
            SELECT u.id, u.name, u.email, u.phone, u.college_id, u.role, u.is_active
            FROM auth_tokens t
            JOIN users u ON u.id = t.user_id
            WHERE t.token_hash = ? AND t.expires_at > NOW() AND u.is_active = 1
        ');
        $st->execute([$tokenHash]);
        $u = $st->fetch();

        if (!$u) {
            Response::error('UNAUTHENTICATED', 'Session expired or invalid token. Please log in again.', 401);
        }
        return $u;
    }

    public static function require(array $roles): array
    {
        $u = self::user();
        if (!in_array($u['role'], $roles, true)) {
            Response::error('FORBIDDEN', 'You do not have permission to access this resource.', 403);
        }
        return $u;
    }
}
