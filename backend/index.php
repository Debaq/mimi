<?php
/**
 * MIMI Backend - Punto de entrada principal
 *
 * Todas las peticiones son redirigidas aqui por .htaccess
 * Funciona en raiz o en cualquier subdirectorio.
 */

// Sin mostrar errores al usuario (se loguean internamente)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Cargar configuracion (define BASE_PATH, DB_PATH, JWT_SECRET, etc.)
require_once __DIR__ . '/config.php';

// === CORS ===
$allowedOrigins = unserialize(CORS_ORIGINS);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (!empty($origin)) {
    // En produccion, si el origin coincide con el host actual, permitir
    $currentHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    if (!empty($currentHost) && strpos($origin, $currentHost) !== false) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: *');
    }
} else {
    // Sin header Origin (peticion directa, no AJAX cross-origin)
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');
header('Access-Control-Allow-Credentials: true');

// Responder preflight OPTIONS inmediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar archivos core
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Request.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Middleware.php';
require_once __DIR__ . '/core/LTIHelper.php';

// Cargar validadores
require_once __DIR__ . '/validators/CoherenceValidator.php';
require_once __DIR__ . '/validators/MicroDefenseGenerator.php';
require_once __DIR__ . '/validators/DefenseQuestionGenerator.php';

// Verificar que la DB existe
if (!file_exists(DB_PATH)) {
    Response::error('Base de datos no encontrada. Ejecuta install.php primero.', 500);
}

// Crear instancia del router
$router = new Router();

// Cargar rutas
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/sessions.php';
require_once __DIR__ . '/routes/protocols.php';
require_once __DIR__ . '/routes/progress.php';
require_once __DIR__ . '/routes/resources.php';
require_once __DIR__ . '/routes/dashboard.php';
require_once __DIR__ . '/routes/certificates.php';
require_once __DIR__ . '/routes/detective.php';
require_once __DIR__ . '/routes/laboratory.php';
require_once __DIR__ . '/routes/defense.php';
require_once __DIR__ . '/routes/lms.php';
require_once __DIR__ . '/routes/admin.php';

// Despachar la peticion
$router->dispatch();
