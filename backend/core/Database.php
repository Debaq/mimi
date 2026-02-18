<?php
/**
 * Database - Singleton para conexion PDO SQLite
 */
class Database
{
    /** @var PDO|null */
    private static $instance = null;

    /**
     * Constructor privado para evitar instanciacion directa
     */
    private function __construct()
    {
    }

    /**
     * Prevenir clonacion
     */
    private function __clone()
    {
    }

    /**
     * Obtener la instancia unica de PDO
     *
     * @return PDO
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            $dataDir = dirname(DB_PATH);

            // Crear directorio data/ si no existe
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0755, true);
            }

            try {
                self::$instance = new PDO('sqlite:' . DB_PATH);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                self::$instance->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

                // Habilitar WAL mode para mejor rendimiento
                self::$instance->exec('PRAGMA journal_mode=WAL');
                // Habilitar foreign keys
                self::$instance->exec('PRAGMA foreign_keys=ON');
            } catch (PDOException $e) {
                if (defined('DEBUG_MODE') && DEBUG_MODE) {
                    die('Error de conexion a la base de datos: ' . $e->getMessage());
                }
                die('Error de conexion a la base de datos.');
            }
        }

        return self::$instance;
    }
}
