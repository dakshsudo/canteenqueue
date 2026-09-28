<?php
declare(strict_types=1);

final class Validator
{
    public static function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            Response::error('INVALID_JSON', 'Malformed JSON payload', 400);
        }
        return $data;
    }
}
