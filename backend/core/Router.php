<?php
/**
 * Router - Enrutador simple con soporte para parametros de ruta
 */
class Router
{
    /** @var array */
    private $routes = array();

    /** @var Request */
    private $request;

    /** @var array Parametros extraidos de la ruta */
    private $params = array();

    public function __construct()
    {
        $this->request = new Request();
    }

    /**
     * Registrar ruta GET
     *
     * @param string $path
     * @param callable $handler
     */
    public function get($path, $handler)
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Registrar ruta POST
     *
     * @param string $path
     * @param callable $handler
     */
    public function post($path, $handler)
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Registrar ruta PUT
     *
     * @param string $path
     * @param callable $handler
     */
    public function put($path, $handler)
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Registrar ruta DELETE
     *
     * @param string $path
     * @param callable $handler
     */
    public function delete($path, $handler)
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Agregar ruta al registro interno
     *
     * @param string $method
     * @param string $path
     * @param callable $handler
     */
    private function addRoute($method, $path, $handler)
    {
        $this->routes[] = array(
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        );
    }

    /**
     * Obtener el objeto Request
     *
     * @return Request
     */
    public function getRequest()
    {
        return $this->request;
    }

    /**
     * Obtener los parametros de ruta extraidos
     *
     * @return array
     */
    public function getParams()
    {
        return $this->params;
    }

    /**
     * Obtener un parametro de ruta especifico
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function getParam($key, $default = null)
    {
        return isset($this->params[$key]) ? $this->params[$key] : $default;
    }

    /**
     * Despachar la peticion actual a la ruta correspondiente
     */
    public function dispatch()
    {
        $method = $this->request->method();
        $uri = $this->request->uri();

        // Manejar peticiones OPTIONS automaticamente (preflight CORS)
        if ($method === 'OPTIONS') {
            http_response_code(200);
            header('Content-Type: text/plain');
            exit;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->matchRoute($route['path'], $uri);
            if ($params !== false) {
                $this->params = $params;
                call_user_func($route['handler'], $this);
                return;
            }
        }

        // Ninguna ruta coincidio
        Response::error('Ruta no encontrada: ' . $method . ' ' . $uri, 404);
    }

    /**
     * Intentar hacer match de una ruta con la URI
     *
     * @param string $routePath Patron de ruta (ej: /api/sessions/{id})
     * @param string $uri URI actual
     * @return array|false Parametros extraidos o false si no hay match
     */
    private function matchRoute($routePath, $uri)
    {
        // Normalizar las rutas
        $routePath = rtrim($routePath, '/');
        $uri = rtrim($uri, '/');

        if ($routePath === '') {
            $routePath = '/';
        }
        if ($uri === '') {
            $uri = '/';
        }

        // Si no tiene parametros, comparar directamente
        if (strpos($routePath, '{') === false) {
            if ($routePath === $uri) {
                return array();
            }
            return false;
        }

        // Convertir patron de ruta a regex
        $routeParts = explode('/', $routePath);
        $uriParts = explode('/', $uri);

        if (count($routeParts) !== count($uriParts)) {
            return false;
        }

        $params = array();
        for ($i = 0; $i < count($routeParts); $i++) {
            $routePart = $routeParts[$i];
            $uriPart = $uriParts[$i];

            // Verificar si es un parametro {name}
            if (strlen($routePart) > 2 && $routePart[0] === '{' && $routePart[strlen($routePart) - 1] === '}') {
                $paramName = substr($routePart, 1, -1);
                $params[$paramName] = $uriPart;
            } else {
                if ($routePart !== $uriPart) {
                    return false;
                }
            }
        }

        return $params;
    }
}
