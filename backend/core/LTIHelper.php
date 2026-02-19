<?php
/**
 * LTIHelper - Clase helper para integracion LTI 1.0
 *
 * Implementa OAuth 1.0 signature validation con HMAC-SHA1
 * y envio de outcomes (calificaciones) al LMS.
 */
class LTIHelper
{
    /**
     * Construir la base string para OAuth 1.0
     *
     * @param string $method Metodo HTTP (GET, POST)
     * @param string $url URL completa del endpoint
     * @param array $params Parametros (sin oauth_signature)
     * @return string Base string codificada
     */
    private static function buildBaseString($method, $url, $params)
    {
        // Ordenar parametros alfabeticamente por clave
        ksort($params);

        // Codificar cada par clave=valor con RFC 3986
        $parts = array();
        foreach ($params as $key => $value) {
            $parts[] = rawurlencode($key) . '=' . rawurlencode($value);
        }
        $paramString = implode('&', $parts);

        // Base string: METHOD&URL&PARAMS (todo codificado)
        $baseString = strtoupper($method) . '&' . rawurlencode($url) . '&' . rawurlencode($paramString);

        return $baseString;
    }

    /**
     * Construir la firma OAuth 1.0 con HMAC-SHA1
     *
     * @param string $method Metodo HTTP
     * @param string $url URL completa del endpoint
     * @param array $params Parametros (sin oauth_signature)
     * @param string $consumerSecret Shared secret del consumidor
     * @param string $tokenSecret Token secret (vacio para LTI 1.0)
     * @return string Firma en Base64
     */
    public static function buildOAuthSignature($method, $url, $params, $consumerSecret, $tokenSecret = '')
    {
        // Remover oauth_signature si existe entre los parametros
        unset($params['oauth_signature']);

        $baseString = self::buildBaseString($method, $url, $params);

        // Signing key: consumer_secret&token_secret
        // En LTI 1.0, token_secret generalmente esta vacio
        $signingKey = rawurlencode($consumerSecret) . '&' . rawurlencode($tokenSecret);

        // HMAC-SHA1
        $signature = base64_encode(hash_hmac('sha1', $baseString, $signingKey, true));

        return $signature;
    }

    /**
     * Validar la firma OAuth 1.0 de un launch LTI
     *
     * @param array $params Todos los parametros recibidos (incluyendo oauth_signature)
     * @param string $consumerSecret Shared secret del consumidor
     * @param string $url URL completa del endpoint que recibio la peticion
     * @return bool True si la firma es valida
     */
    public static function validateOAuthSignature($params, $consumerSecret, $url)
    {
        // Verificar que los parametros OAuth requeridos estan presentes
        $requiredOAuth = array(
            'oauth_consumer_key',
            'oauth_signature_method',
            'oauth_timestamp',
            'oauth_nonce',
            'oauth_version',
            'oauth_signature'
        );

        foreach ($requiredOAuth as $required) {
            if (!isset($params[$required]) || $params[$required] === '') {
                return false;
            }
        }

        // Solo soportamos HMAC-SHA1
        if ($params['oauth_signature_method'] !== 'HMAC-SHA1') {
            return false;
        }

        // Verificar que el timestamp no sea demasiado viejo (5 minutos de tolerancia)
        $timestamp = (int)$params['oauth_timestamp'];
        $now = time();
        if (abs($now - $timestamp) > 300) {
            return false;
        }

        // Extraer la firma recibida
        $receivedSignature = $params['oauth_signature'];

        // Calcular la firma esperada (sin el parametro oauth_signature)
        $expectedSignature = self::buildOAuthSignature('POST', $url, $params, $consumerSecret);

        // Comparacion segura contra timing attacks
        return hash_equals($expectedSignature, $receivedSignature);
    }

    /**
     * Enviar calificacion al LMS via LTI Outcomes Service (POX)
     *
     * Usa el protocolo Basic Outcomes de LTI 1.0 para enviar
     * calificaciones de vuelta al LMS.
     *
     * @param string $outcomeUrl URL del servicio de outcomes del LMS (lis_outcome_service_url)
     * @param string $sourcedId Identificador del resultado (lis_result_sourcedid)
     * @param float $score Calificacion normalizada (0.0 - 1.0)
     * @param string $consumerKey Consumer key de la configuracion LMS
     * @param string $consumerSecret Shared secret del consumidor
     * @return bool True si el envio fue exitoso
     */
    public static function sendOutcome($outcomeUrl, $sourcedId, $score, $consumerKey, $consumerSecret)
    {
        // Validar score
        $score = max(0.0, min(1.0, (float)$score));

        // Generar ID unico para el mensaje
        $messageId = uniqid('mimi_', true);

        // Construir XML POX (Plain Old XML) para replaceResult
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            . '<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">'
            . '<imsx_POXHeader>'
            . '<imsx_POXRequestHeaderInfo>'
            . '<imsx_version>V1.0</imsx_version>'
            . '<imsx_messageIdentifier>' . htmlspecialchars($messageId) . '</imsx_messageIdentifier>'
            . '</imsx_POXRequestHeaderInfo>'
            . '</imsx_POXHeader>'
            . '<imsx_POXBody>'
            . '<replaceResultRequest>'
            . '<resultRecord>'
            . '<sourcedGUID>'
            . '<sourcedId>' . htmlspecialchars($sourcedId) . '</sourcedId>'
            . '</sourcedGUID>'
            . '<result>'
            . '<resultScore>'
            . '<language>en</language>'
            . '<textString>' . sprintf('%.4f', $score) . '</textString>'
            . '</resultScore>'
            . '</result>'
            . '</resultRecord>'
            . '</replaceResultRequest>'
            . '</imsx_POXBody>'
            . '</imsx_POXEnvelopeRequest>';

        // Construir parametros OAuth para la peticion
        $oauthParams = array(
            'oauth_consumer_key' => $consumerKey,
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => (string)time(),
            'oauth_nonce' => bin2hex(random_bytes(16)),
            'oauth_version' => '1.0',
            'oauth_body_hash' => base64_encode(sha1($xml, true))
        );

        // Calcular firma OAuth
        $signature = self::buildOAuthSignature('POST', $outcomeUrl, $oauthParams, $consumerSecret);
        $oauthParams['oauth_signature'] = $signature;

        // Construir header Authorization
        $authParts = array();
        foreach ($oauthParams as $key => $value) {
            $authParts[] = rawurlencode($key) . '="' . rawurlencode($value) . '"';
        }
        $authHeader = 'OAuth ' . implode(', ', $authParts);

        // Enviar peticion HTTP con cURL
        $ch = curl_init();
        curl_setopt_array($ch, array(
            CURLOPT_URL => $outcomeUrl,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $xml,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/xml',
                'Authorization: ' . $authHeader
            ),
            CURLOPT_SSL_VERIFYPEER => true
        ));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        // Verificar respuesta
        if ($curlError !== '' || $httpCode < 200 || $httpCode >= 300) {
            error_log('LTI Outcome error: HTTP ' . $httpCode . ' - ' . $curlError);
            return false;
        }

        // Verificar que la respuesta XML indica exito
        if (strpos($response, 'success') !== false || strpos($response, 'Success') !== false) {
            return true;
        }

        error_log('LTI Outcome response no exitosa: ' . substr($response, 0, 500));
        return false;
    }

    /**
     * Verificar firma HMAC de un webhook
     *
     * @param string $payload Cuerpo crudo de la peticion
     * @param string $signature Firma recibida en el header
     * @param string $secret Shared secret para verificar
     * @return bool True si la firma es valida
     */
    public static function verifyWebhookSignature($payload, $signature, $secret)
    {
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Generar una URL de launch para el LMS
     *
     * @param string $baseUrl URL base del backend de MIMI
     * @return string URL completa de launch LTI
     */
    public static function generateLaunchUrl($baseUrl)
    {
        return rtrim($baseUrl, '/') . '/api/lms/launch';
    }
}
