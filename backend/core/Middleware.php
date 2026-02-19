<?php
/**
 * Middleware - Autenticacion y autorizacion
 */
class Middleware
{
    /**
     * Autenticar al usuario via JWT
     * Termina con 401 si no esta autenticado
     *
     * @return array Datos del usuario decodificados del token
     */
    public static function authenticate()
    {
        $request = new Request();
        $token = $request->getAuthToken();

        if ($token === null) {
            Response::error('Token de autenticacion requerido', 401);
        }

        $payload = Auth::decode($token);
        if ($payload === false) {
            Response::error('Token invalido o expirado', 401);
        }

        // Verificar que el usuario aun existe en la BD
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url FROM users WHERE id = ?');
        $stmt->execute(array($payload['sub']));
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Usuario no encontrado', 401);
        }

        return $user;
    }

    /**
     * Requerir un rol especifico
     * Debe llamarse despues de authenticate()
     *
     * @param string $role Rol requerido ('docente' o 'estudiante')
     * @param array $user Datos del usuario (resultado de authenticate())
     * @return array Los mismos datos del usuario
     */
    public static function requireRole($role, $user)
    {
        if ($user['role'] !== $role) {
            Response::error('No tienes permisos para realizar esta accion. Se requiere rol: ' . $role, 403);
        }
        return $user;
    }

    /**
     * Rate limiting por IP y endpoint
     * Protege endpoints publicos contra ataques de fuerza bruta
     *
     * @param string $endpoint Identificador del endpoint
     * @param int $maxAttempts Intentos maximos permitidos en la ventana
     * @param int $windowMinutes Duracion de la ventana en minutos
     */
    public static function rateLimit($endpoint, $maxAttempts = 5, $windowMinutes = 15)
    {
        // Obtener IP del cliente (con soporte para proxy/load balancer)
        $ip = isset($_SERVER['HTTP_X_FORWARDED_FOR'])
            ? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]
            : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0');
        $ip = trim($ip);

        $db = Database::getInstance();

        // Limpieza periodica de registros viejos (1% de probabilidad)
        if (mt_rand(1, 100) === 1) {
            $db->prepare(
                'DELETE FROM rate_limits WHERE datetime(window_start) < datetime("now", "-24 hours")'
            )->execute();
        }

        // Buscar registro existente para esta IP + endpoint
        $stmt = $db->prepare(
            'SELECT id, attempts, window_start FROM rate_limits WHERE ip_address = ? AND endpoint = ?'
        );
        $stmt->execute(array($ip, $endpoint));
        $record = $stmt->fetch();

        if ($record) {
            // Calcular si la ventana sigue activa
            $windowStart = strtotime($record['window_start']);
            $windowEnd = $windowStart + ($windowMinutes * 60);
            $now = time();

            if ($now < $windowEnd) {
                // Ventana activa: verificar intentos
                if ((int)$record['attempts'] >= $maxAttempts) {
                    $minutesLeft = (int)ceil(($windowEnd - $now) / 60);
                    Response::error(
                        'Demasiados intentos. Intenta de nuevo en ' . $minutesLeft . ' minutos.',
                        429
                    );
                }

                // Incrementar intentos
                $stmt = $db->prepare(
                    'UPDATE rate_limits SET attempts = attempts + 1 WHERE id = ?'
                );
                $stmt->execute(array($record['id']));
            } else {
                // Ventana expirada: resetear contador
                $stmt = $db->prepare(
                    'UPDATE rate_limits SET attempts = 1, window_start = datetime("now") WHERE id = ?'
                );
                $stmt->execute(array($record['id']));
            }
        } else {
            // No existe registro: crear uno nuevo
            $stmt = $db->prepare(
                'INSERT INTO rate_limits (ip_address, endpoint, attempts, window_start) VALUES (?, ?, 1, datetime("now"))'
            );
            $stmt->execute(array($ip, $endpoint));
        }
    }

    /**
     * Autenticacion opcional
     * Intenta autenticar pero no falla si no hay token
     *
     * @return array|null Datos del usuario o null
     */
    public static function optionalAuth()
    {
        $request = new Request();
        $token = $request->getAuthToken();

        if ($token === null) {
            return null;
        }

        $payload = Auth::decode($token);
        if ($payload === false) {
            return null;
        }

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url FROM users WHERE id = ?');
        $stmt->execute(array($payload['sub']));
        $user = $stmt->fetch();

        return $user ? $user : null;
    }
}
