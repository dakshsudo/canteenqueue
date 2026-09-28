<?php
declare(strict_types=1);

final class Settings
{
    private static ?array $cache = null;

    public static function all(): array
    {
        if (self::$cache === null) {
            $stmt = Database::pdo()->query('SELECT setting_key, setting_value FROM settings');
            $rows = $stmt->fetchAll();
            self::$cache = [];
            foreach ($rows as $r) {
                self::$cache[$r['setting_key']] = $r['setting_value'];
            }
        }
        return self::$cache;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $all = self::all();
        return $all[$key] ?? $default;
    }
}
