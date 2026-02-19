<?php
/**
 * Rutas de certificados digitales
 */

// GET /api/certificates/{protocolId} - Obtener certificado de un protocolo (AUTH)
$router->get('/api/certificates/{protocolId}', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('protocolId');

    $db = Database::getInstance();

    // Obtener protocolo con datos del estudiante y sesion
    $stmt = $db->prepare(
        'SELECT p.*, u.name as student_name, s.title as session_title
         FROM protocols p
         JOIN users u ON u.id = p.student_id
         JOIN sessions s ON s.id = p.session_id
         WHERE p.id = ?'
    );
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    // Verificar que el protocolo esta aprobado
    if ($protocol['status'] !== 'aprobado') {
        Response::error('El protocolo no esta aprobado. Solo se pueden generar certificados para protocolos aprobados.', 400);
    }

    // Verificar acceso: dueno del protocolo o docente de la sesion
    if ($user['role'] === 'estudiante' && $protocol['student_id'] != $user['id']) {
        Response::error('No tienes acceso a este certificado', 403);
    }

    if ($user['role'] === 'docente') {
        $stmt = $db->prepare('SELECT teacher_id FROM sessions WHERE id = ?');
        $stmt->execute(array($protocol['session_id']));
        $session = $stmt->fetch();
        if ($session['teacher_id'] != $user['id']) {
            Response::error('No tienes acceso a este certificado', 403);
        }
    }

    // Buscar certificado existente
    $stmt = $db->prepare('SELECT * FROM certificates WHERE protocol_id = ?');
    $stmt->execute(array($protocolId));
    $certificate = $stmt->fetch();

    // Si no existe, generarlo automaticamente
    if (!$certificate) {
        // Generar codigo unico: MIMI-{YEAR}-{8 chars}
        $code = generateCertificateCode($db);

        // Determinar fecha de aprobacion
        $approvedAt = $protocol['updated_at'] ? $protocol['updated_at'] : date('Y-m-d H:i:s');

        $stmt = $db->prepare(
            'INSERT INTO certificates (protocol_id, student_id, certificate_code, student_name, session_title, approved_at)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $protocolId,
            $protocol['student_id'],
            $code,
            $protocol['student_name'],
            $protocol['session_title'],
            $approvedAt
        ));

        // Obtener el certificado recien creado
        $stmt = $db->prepare('SELECT * FROM certificates WHERE protocol_id = ?');
        $stmt->execute(array($protocolId));
        $certificate = $stmt->fetch();
    }

    Response::success($certificate, 'Certificado obtenido exitosamente');
});

// GET /api/certificates/verify/{code} - Verificar certificado por codigo (PUBLICO)
$router->get('/api/certificates/verify/{code}', function ($router) {
    $code = $router->getParam('code');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM certificates WHERE certificate_code = ?');
    $stmt->execute(array($code));
    $certificate = $stmt->fetch();

    if (!$certificate) {
        Response::error('Certificado no encontrado. El codigo ingresado no corresponde a ningun certificado valido.', 404);
    }

    // Devolver datos basicos (sin IDs internos sensibles)
    $publicData = array(
        'certificate_code' => $certificate['certificate_code'],
        'student_name' => $certificate['student_name'],
        'session_title' => $certificate['session_title'],
        'approved_at' => $certificate['approved_at'],
        'issued_at' => $certificate['issued_at']
    );

    Response::success($publicData, 'Certificado valido');
});

/**
 * Generar codigo unico de certificado
 * Formato: MIMI-{YEAR}-{8 caracteres alfanumericos en mayuscula}
 *
 * @param PDO $db
 * @return string
 */
function generateCertificateCode($db)
{
    $year = date('Y');
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $maxAttempts = 10;

    for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
        $random = '';
        for ($i = 0; $i < 8; $i++) {
            $random .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $code = 'MIMI-' . $year . '-' . $random;

        // Verificar unicidad
        $stmt = $db->prepare('SELECT id FROM certificates WHERE certificate_code = ?');
        $stmt->execute(array($code));
        if (!$stmt->fetch()) {
            return $code;
        }
    }

    // Fallback extremadamente improbable
    return 'MIMI-' . $year . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 8));
}
