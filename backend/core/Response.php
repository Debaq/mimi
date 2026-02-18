<?php
/**
 * Response - Metodos estaticos para respuestas HTTP en JSON
 */
class Response
{
    /**
     * Enviar respuesta JSON generica
     *
     * @param mixed $data
     * @param int $status
     */
    public static function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Enviar respuesta de exito
     *
     * @param mixed $data
     * @param string $message
     * @param int $status
     */
    public static function success($data = null, $message = 'OK', $status = 200)
    {
        $response = array(
            'success' => true,
            'message' => $message
        );
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response, $status);
    }

    /**
     * Enviar respuesta de error
     *
     * @param string $message
     * @param int $status
     * @param mixed $errors
     */
    public static function error($message, $status = 400, $errors = null)
    {
        $response = array(
            'success' => false,
            'message' => $message
        );
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        self::json($response, $status);
    }
}
