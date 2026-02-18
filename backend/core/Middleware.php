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
