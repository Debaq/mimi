<?php
/**
 * Request - Parsear peticiones HTTP entrantes
 *
 * Detecta automaticamente el subdirectorio base y lo elimina
 * de la URI para que las rutas /api/... funcionen sin importar
 * si el backend esta en raiz o en un subdirectorio.
 */
class Request
{
    /** @var string */
    private $method;

    /** @var string */
    private $uri;

    /** @var array|null */
    private $bodyData;

    /** @var array */
    private $queryParams;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD']);

        // Obtener URI limpia
        $uri = $_SERVER['REQUEST_URI'];

        // Eliminar query string
        $uri = strtok($uri, '?');

        // Eliminar el subdirectorio base (BASE_PATH) de la URI
        // Esto permite que el backend funcione en cualquier subdirectorio
        $basePath = defined('BASE_PATH') ? BASE_PATH : '';
        if (!empty($basePath) && strpos($uri, $basePath) === 0) {
            $uri = substr($uri, strlen($basePath));
        }

        // Normalizar
        $uri = '/' . ltrim($uri, '/');
        $uri = rtrim($uri, '/');
        if ($uri === '') {
            $uri = '/';
        }

        $this->uri = $uri;
        $this->queryParams = $_GET;
        $this->bodyData = null;
    }

    /**
     * Obtener el metodo HTTP
     *
     * @return string
     */
    public function method()
    {
        return $this->method;
    }

    /**
     * Obtener la URI de la peticion (sin base path)
     *
     * @return string
     */
    public function uri()
    {
        return $this->uri;
    }

    /**
     * Obtener el cuerpo de la peticion decodificado como JSON
     *
     * @return array
     */
    public function body()
    {
        if ($this->bodyData === null) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            $this->bodyData = is_array($decoded) ? $decoded : array();
        }
        return $this->bodyData;
    }

    /**
     * Obtener un parametro del body o query string
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function param($key, $default = null)
    {
        $body = $this->body();
        if (isset($body[$key])) {
            return $body[$key];
        }
        if (isset($this->queryParams[$key])) {
            return $this->queryParams[$key];
        }
        return $default;
    }

    /**
     * Obtener un header HTTP
     *
     * @param string $key
     * @return string|null
     */
    public function header($key)
    {
        // Convertir a formato HTTP_* de $_SERVER
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        if (isset($_SERVER[$serverKey])) {
            return $_SERVER[$serverKey];
        }

        // Caso especial para Content-Type y Content-Length
        $specialKey = strtoupper(str_replace('-', '_', $key));
        if (isset($_SERVER[$specialKey])) {
            return $_SERVER[$specialKey];
        }

        return null;
    }

    /**
     * Extraer el token Bearer del header Authorization
     *
     * @return string|null
     */
    public function getAuthToken()
    {
        $authHeader = $this->header('Authorization');
        if ($authHeader === null) {
            return null;
        }

        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }

        return null;
    }

    /**
     * Obtener parametro del query string
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function query($key, $default = null)
    {
        return isset($this->queryParams[$key]) ? $this->queryParams[$key] : $default;
    }
}
