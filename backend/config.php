<?php
/**
 * MIMI - Configuracion global del backend
 *
 * Auto-detecta si esta en raiz o subdirectorio.
 */

// === Auto-deteccion de rutas ===

// Detectar el directorio base donde vive el backend
// Funciona tanto en raiz (/) como en subdirectorios (/mimi/, /api/, etc.)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
if ($scriptDir === '/' || $scriptDir === '.') {
    $scriptDir = '';
}
define('BASE_PATH', $scriptDir);

// Ruta absoluta en disco al directorio del backend
define('APP_ROOT', str_replace('\\', '/', __DIR__));

// Ruta a la base de datos SQLite
define('DB_PATH', APP_ROOT . '/data/mimi.db');

// Clave secreta para firmar tokens JWT (CAMBIAR EN PRODUCCION)
define('JWT_SECRET', 'mimi_s3cr3t_k3y_pr0d_2024_x7Zk9QwR4tYm8nPv');

// Tiempo de expiracion del JWT en segundos (7 dias)
define('JWT_EXPIRY', 86400 * 7);

// Origenes permitidos para CORS
// Se auto-detecta el origen actual y se agregan los de desarrollo
$detectedOrigin = '';
if (isset($_SERVER['HTTP_HOST'])) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $detectedOrigin = $scheme . '://' . $_SERVER['HTTP_HOST'];
}

$corsOrigins = array(
    'http://localhost:5173',
    'http://localhost:3000'
);

// Agregar el dominio de produccion detectado
if (!empty($detectedOrigin) && !in_array($detectedOrigin, $corsOrigins)) {
    $corsOrigins[] = $detectedOrigin;
}

define('CORS_ORIGINS', serialize($corsOrigins));

// Nombre de la aplicacion
define('APP_NAME', 'MIMI');

// Modo de depuracion (desactivar en produccion)
define('DEBUG_MODE', false);

// Zona horaria
date_default_timezone_set('America/Mexico_City');
