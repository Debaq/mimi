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
        // Admin puede acceder a cualquier endpoint (bypass para "Ver como...")
        if ($user['role'] === 'admin') {
            return $user;
        }
        // Docente puede acceder a endpoints de estudiante (bypass para "Ver como...")
        if ($user['role'] === 'docente' && $role === 'estudiante') {
            return $user;
        }
        if ($user['role'] !== $role) {
            Response::error('No tienes permisos para realizar esta accion. Se requiere rol: ' . $role, 403);
        }
        return $user;
    }

    /**
     * Requerir cualquiera de los roles especificados
     *
     * @param array $roles Roles permitidos (ej: array('admin', 'docente'))
     * @param array $user Datos del usuario
     * @return array Los mismos datos del usuario
     */
    public static function requireAnyRole($roles, $user)
    {
        if (!in_array($user['role'], $roles)) {
            Response::error('No tienes permisos para realizar esta accion. Se requiere uno de los roles: ' . implode(', ', $roles), 403);
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
    public static function rateLimit($endpoint, $maxAttempts = 30, $windowMinutes = 5)
    {
        // Obtener IP del cliente (con soporte para proxy/load balancer)
        $ip = isset($_SERVER['HTTP_X_FORWARDED_FOR'])
            ? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]
            : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0');
        $ip = trim($ip);

        $db = Database::getInstance();

        // Limpieza: eliminar registros con ventana expirada (mas de 1 hora)
        $db->exec('DELETE FROM rate_limits WHERE datetime(window_start) < datetime("now", "-1 hour")');

        // Buscar registro existente para esta IP + endpoint
        $stmt = $db->prepare(
            'SELECT id, attempts, window_start FROM rate_limits WHERE ip_address = ? AND endpoint = ?'
        );
        $stmt->execute(array($ip, $endpoint));
        $record = $stmt->fetch();

        if ($record) {
            $windowStart = strtotime($record['window_start']);
            $windowEnd = $windowStart + ($windowMinutes * 60);
            $now = time();

            if ($now < $windowEnd) {
                if ((int)$record['attempts'] >= $maxAttempts) {
                    $secondsLeft = $windowEnd - $now;
                    if ($secondsLeft > 60) {
                        $timeMsg = (int)ceil($secondsLeft / 60) . ' minutos';
                    } else {
                        $timeMsg = $secondsLeft . ' segundos';
                    }
                    Response::error(
                        'Has superado el limite de intentos. Espera ' . $timeMsg . '.',
                        429
                    );
                }

                $stmt = $db->prepare(
                    'UPDATE rate_limits SET attempts = attempts + 1 WHERE id = ?'
                );
                $stmt->execute(array($record['id']));
            } else {
                $stmt = $db->prepare(
                    'UPDATE rate_limits SET attempts = 1, window_start = datetime("now") WHERE id = ?'
                );
                $stmt->execute(array($record['id']));
            }
        } else {
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
