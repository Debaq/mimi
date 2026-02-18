<?php
/**
 * Auth - Implementacion manual de JWT con hash_hmac
 */
class Auth
{
    /**
     * Codificar en base64 URL-safe
     *
     * @param string $data
     * @return string
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decodificar base64 URL-safe
     *
     * @param string $data
     * @return string
     */
    private static function base64UrlDecode($data)
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Crear un token JWT
     *
     * @param array $payload
     * @return string
     */
    public static function encode($payload)
    {
        $header = array(
            'typ' => 'JWT',
            'alg' => 'HS256'
        );

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * Verificar y decodificar un token JWT
     *
     * @param string $token
     * @return array|false Retorna el payload o false si es invalido
     */
    public static function decode($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        $headerEncoded = $parts[0];
        $payloadEncoded = $parts[1];
        $signatureProvided = $parts[2];

        // Verificar la firma
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signatureProvided)) {
            return false;
        }

        // Decodificar el payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!is_array($payload)) {
            return false;
        }

        // Verificar expiracion
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Generar hash de password con bcrypt
     *
     * @param string $password
     * @return string
     */
    public static function hashPassword($password)
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    /**
     * Verificar password contra hash
     *
     * @param string $password
     * @param string $hash
     * @return bool
     */
    public static function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    /**
     * Generar token JWT para un usuario
     *
     * @param array $user Datos del usuario (id, email, role)
     * @return string Token JWT
     */
    public static function generateToken($user)
    {
        $payload = array(
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRY
        );
        return self::encode($payload);
    }
}
