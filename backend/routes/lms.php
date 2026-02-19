<?php
/**
 * Rutas de integracion LMS (Learning Management Systems)
 *
 * Implementa endpoints para:
 * - Configuracion de integracion LMS
 * - LTI 1.0 Launch (entrada desde LMS externo)
 * - Sincronizacion de calificaciones
 * - Webhooks para eventos del LMS
 */

// === Crear tabla lms_configs si no existe ===
$db = Database::getInstance();
$db->exec('CREATE TABLE IF NOT EXISTS lms_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    platform TEXT NOT NULL DEFAULT \'generic\',
    lms_url TEXT NOT NULL,
    consumer_key TEXT NOT NULL UNIQUE,
    shared_secret TEXT NOT NULL,
    config TEXT DEFAULT \'{}\',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
)');

// === Crear tabla lms_user_links para vincular usuarios LTI con usuarios MIMI ===
$db->exec('CREATE TABLE IF NOT EXISTS lms_user_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lms_config_id INTEGER NOT NULL,
    lms_user_id TEXT,
    lis_result_sourcedid TEXT,
    lis_outcome_service_url TEXT,
    context_id TEXT,
    resource_link_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lms_config_id) REFERENCES lms_configs(id) ON DELETE CASCADE
)');

// ============================================================
// POST /api/lms/configure - Configurar integracion LMS [DOCENTE]
// ============================================================
$router->post('/api/lms/configure', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $errors = array();

    $allowedPlatforms = array('moodle', 'canvas', 'generic');
    if (empty($body['platform']) || !in_array($body['platform'], $allowedPlatforms)) {
        $errors[] = 'La plataforma debe ser: moodle, canvas o generic';
    }
    if (empty($body['lms_url'])) {
        $errors[] = 'La URL del LMS es requerida';
    } elseif (!filter_var($body['lms_url'], FILTER_VALIDATE_URL)) {
        $errors[] = 'La URL del LMS no es valida';
    }

    if (!empty($errors)) {
        Response::error('Datos de configuracion invalidos', 400, $errors);
    }

    $db = Database::getInstance();

    // Generar consumer_key y shared_secret si no se proporcionan
    $consumerKey = !empty($body['consumer_key'])
        ? trim($body['consumer_key'])
        : 'mimi_' . bin2hex(random_bytes(12));

    $sharedSecret = !empty($body['shared_secret'])
        ? trim($body['shared_secret'])
        : bin2hex(random_bytes(24));

    // Verificar si ya existe una configuracion para este docente
    $stmt = $db->prepare('SELECT id FROM lms_configs WHERE teacher_id = ?');
    $stmt->execute(array($user['id']));
    $existing = $stmt->fetch();

    if ($existing) {
        // Actualizar configuracion existente
        $stmt = $db->prepare(
            'UPDATE lms_configs SET platform = ?, lms_url = ?, consumer_key = ?, shared_secret = ?, config = ? WHERE teacher_id = ?'
        );
        $stmt->execute(array(
            $body['platform'],
            rtrim(trim($body['lms_url']), '/'),
            $consumerKey,
            $sharedSecret,
            isset($body['config']) ? json_encode($body['config']) : '{}',
            $user['id']
        ));
        $configId = $existing['id'];
    } else {
        // Crear nueva configuracion
        $stmt = $db->prepare(
            'INSERT INTO lms_configs (teacher_id, platform, lms_url, consumer_key, shared_secret, config) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $user['id'],
            $body['platform'],
            rtrim(trim($body['lms_url']), '/'),
            $consumerKey,
            $sharedSecret,
            isset($body['config']) ? json_encode($body['config']) : '{}'
        ));
        $configId = $db->lastInsertId();
    }

    // Generar launch URL
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $basePath = defined('BASE_PATH') ? BASE_PATH : '';
    $baseUrl = $scheme . '://' . $host . $basePath;
    $launchUrl = LTIHelper::generateLaunchUrl($baseUrl);

    // Obtener configuracion guardada
    $stmt = $db->prepare('SELECT * FROM lms_configs WHERE id = ?');
    $stmt->execute(array($configId));
    $config = $stmt->fetch();
    $config['config'] = json_decode($config['config'], true);

    Response::success(array(
        'config' => $config,
        'launch_url' => $launchUrl,
        'consumer_key' => $consumerKey,
        'shared_secret' => $sharedSecret
    ), 'Configuracion LMS guardada exitosamente');
});

// ============================================================
// GET /api/lms/config - Ver configuracion actual [DOCENTE]
// ============================================================
$router->get('/api/lms/config', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM lms_configs WHERE teacher_id = ?');
    $stmt->execute(array($user['id']));
    $config = $stmt->fetch();

    if (!$config) {
        Response::success(array(
            'config' => null,
            'launch_url' => null
        ), 'No hay configuracion LMS');
    }

    $config['config'] = json_decode($config['config'], true);

    // Generar launch URL
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $basePath = defined('BASE_PATH') ? BASE_PATH : '';
    $baseUrl = $scheme . '://' . $host . $basePath;
    $launchUrl = LTIHelper::generateLaunchUrl($baseUrl);

    Response::success(array(
        'config' => $config,
        'launch_url' => $launchUrl
    ));
});

// ============================================================
// POST /api/lms/launch - LTI 1.0 Launch endpoint [PUBLICO]
// ============================================================
$router->post('/api/lms/launch', function ($router) {
    Middleware::rateLimit('lti_launch', 30, 5);

    // Los parametros LTI vienen como POST form-urlencoded, no JSON
    $params = $_POST;

    // Si no hay datos en $_POST, intentar parsear el body
    if (empty($params)) {
        $raw = file_get_contents('php://input');
        parse_str($raw, $params);
    }

    // Validar parametros LTI minimos
    if (empty($params['oauth_consumer_key'])) {
        Response::error('Parametro oauth_consumer_key requerido', 400);
    }

    $db = Database::getInstance();

    // Buscar configuracion LMS por consumer_key
    $stmt = $db->prepare('SELECT * FROM lms_configs WHERE consumer_key = ?');
    $stmt->execute(array($params['oauth_consumer_key']));
    $lmsConfig = $stmt->fetch();

    if (!$lmsConfig) {
        Response::error('Consumer key no reconocido', 401);
    }

    // Construir la URL completa de este endpoint para validar la firma
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $basePath = defined('BASE_PATH') ? BASE_PATH : '';
    $launchUrl = $scheme . '://' . $host . $basePath . '/api/lms/launch';

    // Validar firma OAuth 1.0
    if (!LTIHelper::validateOAuthSignature($params, $lmsConfig['shared_secret'], $launchUrl)) {
        Response::error('Firma OAuth invalida', 401);
    }

    // Extraer datos del usuario LTI
    $ltiName = isset($params['lis_person_name_full'])
        ? trim($params['lis_person_name_full'])
        : 'Usuario LTI';
    $ltiEmail = isset($params['lis_person_contact_email_primary'])
        ? strtolower(trim($params['lis_person_contact_email_primary']))
        : '';
    $ltiRoles = isset($params['roles']) ? $params['roles'] : '';
    $contextId = isset($params['context_id']) ? $params['context_id'] : '';
    $contextTitle = isset($params['context_title']) ? $params['context_title'] : '';
    $resourceLinkId = isset($params['resource_link_id']) ? $params['resource_link_id'] : '';
    $lisResultSourcedId = isset($params['lis_result_sourcedid']) ? $params['lis_result_sourcedid'] : '';
    $lisOutcomeServiceUrl = isset($params['lis_outcome_service_url']) ? $params['lis_outcome_service_url'] : '';

    // Determinar rol en MIMI segun roles LTI
    // LTI roles: Instructor, Learner, Administrator, etc.
    $mimiRole = 'estudiante';
    $rolesLower = strtolower($ltiRoles);
    if (strpos($rolesLower, 'instructor') !== false
        || strpos($rolesLower, 'administrator') !== false
        || strpos($rolesLower, 'contentdeveloper') !== false
    ) {
        $mimiRole = 'docente';
    }

    // Buscar usuario existente por email
    $mimiUser = null;
    if (!empty($ltiEmail)) {
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute(array($ltiEmail));
        $mimiUser = $stmt->fetch();
    }

    if (!$mimiUser) {
        // Crear usuario automaticamente
        // Generar password aleatorio (el usuario no lo necesita, entra por LTI)
        $randomPassword = bin2hex(random_bytes(16));
        $passwordHash = Auth::hashPassword($randomPassword);

        // Si no hay email, generar uno basado en consumer_key + nonce
        if (empty($ltiEmail)) {
            $ltiEmail = 'lti_' . bin2hex(random_bytes(8)) . '@mimi.lti';
        }

        $stmt = $db->prepare(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $ltiName,
            $ltiEmail,
            $passwordHash,
            $mimiRole
        ));

        $userId = $db->lastInsertId();

        $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute(array($userId));
        $mimiUser = $stmt->fetch();

        // Registrar actividad
        $stmt = $db->prepare(
            'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $userId,
            'lti_register',
            0,
            json_encode(array(
                'platform' => $lmsConfig['platform'],
                'context_id' => $contextId
            ))
        ));
    }

    // Guardar o actualizar vinculacion LTI
    $stmt = $db->prepare(
        'SELECT id FROM lms_user_links WHERE user_id = ? AND lms_config_id = ?'
    );
    $stmt->execute(array($mimiUser['id'], $lmsConfig['id']));
    $existingLink = $stmt->fetch();

    if ($existingLink) {
        $stmt = $db->prepare(
            'UPDATE lms_user_links SET lis_result_sourcedid = ?, lis_outcome_service_url = ?, context_id = ?, resource_link_id = ? WHERE id = ?'
        );
        $stmt->execute(array(
            $lisResultSourcedId,
            $lisOutcomeServiceUrl,
            $contextId,
            $resourceLinkId,
            $existingLink['id']
        ));
    } else {
        $stmt = $db->prepare(
            'INSERT INTO lms_user_links (user_id, lms_config_id, lis_result_sourcedid, lis_outcome_service_url, context_id, resource_link_id) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $mimiUser['id'],
            $lmsConfig['id'],
            $lisResultSourcedId,
            $lisOutcomeServiceUrl,
            $contextId,
            $resourceLinkId
        ));
    }

    // Generar JWT de MIMI para el usuario
    $token = Auth::generateToken($mimiUser);

    // Determinar URL del frontend para redireccion
    $frontendUrl = 'http://localhost:5173';
    $lmsConfigData = json_decode($lmsConfig['config'], true);
    if (isset($lmsConfigData['frontend_url'])) {
        $frontendUrl = $lmsConfigData['frontend_url'];
    }

    // Redirigir al frontend con el token
    $redirectUrl = $frontendUrl . '/lti-callback?token=' . urlencode($token)
        . '&role=' . urlencode($mimiRole);

    if (!empty($contextId)) {
        $redirectUrl .= '&context=' . urlencode($contextId);
    }

    header('Location: ' . $redirectUrl);
    http_response_code(302);
    exit;
});

// ============================================================
// GET /api/lms/grades/{sessionId} - Exportar calificaciones [DOCENTE]
// ============================================================
$router->get('/api/lms/grades/{sessionId}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $sessionId = $router->getParam('sessionId');
    $request = $router->getRequest();
    $format = $request->query('format', 'json');

    $db = Database::getInstance();

    // Verificar que la sesion pertenece al docente
    $stmt = $db->prepare('SELECT id, title FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    // Obtener calificaciones de todos los estudiantes de la sesion
    $stmt = $db->prepare(
        'SELECT u.name as student_name,
                u.email as student_email,
                p.status as protocol_status,
                p.current_step,
                p.created_at as protocol_started_at,
                p.updated_at as completed_at,
                COALESCE(
                    (SELECT SUM(al.xp_earned) FROM activity_log al
                     WHERE al.user_id = u.id
                     AND al.details LIKE ?),
                    0
                ) as xp_earned
         FROM session_students ss
         JOIN users u ON u.id = ss.student_id
         LEFT JOIN protocols p ON p.session_id = ss.session_id AND p.student_id = ss.student_id
         WHERE ss.session_id = ?
         ORDER BY u.name ASC'
    );
    $stmt->execute(array(
        '%"session_id":' . (int)$sessionId . '%',
        $sessionId
    ));
    $grades = $stmt->fetchAll();

    // Calcular score normalizado (0-1) para cada estudiante
    foreach ($grades as &$grade) {
        $score = 0.0;
        if ($grade['protocol_status'] === 'aprobado') {
            $score = 1.0;
        } elseif ($grade['protocol_status'] === 'en_revision') {
            $score = 0.7;
        } elseif ($grade['protocol_status'] === 'borrador' || $grade['protocol_status'] === 'en_progreso') {
            $score = 0.3;
        } elseif ($grade['protocol_status'] === 'rechazado') {
            $score = 0.2;
        }
        $grade['score'] = $score;
        $grade['xp_earned'] = (int)$grade['xp_earned'];
    }
    unset($grade);

    // Si se solicita formato CSV
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="calificaciones_sesion_' . $sessionId . '.csv"');

        $output = fopen('php://output', 'w');

        // BOM UTF-8 para Excel
        fwrite($output, "\xEF\xBB\xBF");

        // Cabecera CSV
        fputcsv($output, array(
            'Nombre',
            'Email',
            'Estado Protocolo',
            'Score (0-1)',
            'XP Ganado',
            'Fecha Completado'
        ));

        foreach ($grades as $grade) {
            fputcsv($output, array(
                $grade['student_name'],
                $grade['student_email'],
                $grade['protocol_status'] !== null ? $grade['protocol_status'] : 'sin_iniciar',
                sprintf('%.2f', $grade['score']),
                $grade['xp_earned'],
                $grade['completed_at'] !== null ? $grade['completed_at'] : ''
            ));
        }

        fclose($output);
        exit;
    }

    // Formato JSON por defecto
    Response::success(array(
        'session' => $session,
        'grades' => $grades,
        'total_students' => count($grades)
    ));
});

// ============================================================
// POST /api/lms/grades/sync - Sincronizar calificaciones al LMS [DOCENTE]
// ============================================================
$router->post('/api/lms/grades/sync', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['session_id'])) {
        Response::error('El ID de la sesion es requerido', 400);
    }

    $sessionId = (int)$body['session_id'];

    $db = Database::getInstance();

    // Verificar que la sesion pertenece al docente
    $stmt = $db->prepare('SELECT id FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    if (!$stmt->fetch()) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    // Obtener configuracion LMS del docente
    $stmt = $db->prepare('SELECT * FROM lms_configs WHERE teacher_id = ?');
    $stmt->execute(array($user['id']));
    $lmsConfig = $stmt->fetch();

    if (!$lmsConfig) {
        Response::error('No hay configuracion LMS. Configura la integracion primero.', 400);
    }

    // Obtener estudiantes con protocolos y sus vinculos LTI
    $stmt = $db->prepare(
        'SELECT u.id as user_id,
                u.name as student_name,
                u.email as student_email,
                p.status as protocol_status,
                lul.lis_result_sourcedid,
                lul.lis_outcome_service_url
         FROM session_students ss
         JOIN users u ON u.id = ss.student_id
         LEFT JOIN protocols p ON p.session_id = ss.session_id AND p.student_id = ss.student_id
         LEFT JOIN lms_user_links lul ON lul.user_id = u.id AND lul.lms_config_id = ?
         WHERE ss.session_id = ?'
    );
    $stmt->execute(array($lmsConfig['id'], $sessionId));
    $students = $stmt->fetchAll();

    $results = array(
        'synced' => 0,
        'skipped' => 0,
        'failed' => 0,
        'details' => array()
    );

    foreach ($students as $student) {
        // Verificar que tiene datos LTI para enviar outcomes
        if (empty($student['lis_result_sourcedid']) || empty($student['lis_outcome_service_url'])) {
            $results['skipped']++;
            $results['details'][] = array(
                'student' => $student['student_name'],
                'status' => 'skipped',
                'reason' => 'Sin datos de outcome LTI'
            );
            continue;
        }

        // Calcular score normalizado
        $score = 0.0;
        if ($student['protocol_status'] === 'aprobado') {
            $score = 1.0;
        } elseif ($student['protocol_status'] === 'en_revision') {
            $score = 0.7;
        } elseif ($student['protocol_status'] === 'borrador' || $student['protocol_status'] === 'en_progreso') {
            $score = 0.3;
        } elseif ($student['protocol_status'] === 'rechazado') {
            $score = 0.2;
        }

        // Enviar calificacion al LMS
        $success = LTIHelper::sendOutcome(
            $student['lis_outcome_service_url'],
            $student['lis_result_sourcedid'],
            $score,
            $lmsConfig['consumer_key'],
            $lmsConfig['shared_secret']
        );

        if ($success) {
            $results['synced']++;
            $results['details'][] = array(
                'student' => $student['student_name'],
                'status' => 'synced',
                'score' => $score
            );
        } else {
            $results['failed']++;
            $results['details'][] = array(
                'student' => $student['student_name'],
                'status' => 'failed',
                'score' => $score
            );
        }
    }

    Response::success($results, 'Sincronizacion completada: ' . $results['synced'] . ' enviadas, ' . $results['skipped'] . ' omitidas, ' . $results['failed'] . ' fallidas');
});

// ============================================================
// POST /api/lms/webhook - Webhook para eventos del LMS [PUBLICO con firma]
// ============================================================
$router->post('/api/lms/webhook', function ($router) {
    Middleware::rateLimit('lms_webhook', 60, 5);

    // Leer el payload crudo para verificar la firma
    $rawPayload = file_get_contents('php://input');

    // Obtener la firma del header
    $request = $router->getRequest();
    $signature = $request->header('X-LMS-Signature');
    $consumerKey = $request->header('X-Consumer-Key');

    if (empty($signature) || empty($consumerKey)) {
        Response::error('Firma y consumer key son requeridos en los headers', 401);
    }

    $db = Database::getInstance();

    // Buscar configuracion LMS por consumer_key
    $stmt = $db->prepare('SELECT * FROM lms_configs WHERE consumer_key = ?');
    $stmt->execute(array($consumerKey));
    $lmsConfig = $stmt->fetch();

    if (!$lmsConfig) {
        Response::error('Consumer key no reconocido', 401);
    }

    // Verificar firma HMAC
    if (!LTIHelper::verifyWebhookSignature($rawPayload, $signature, $lmsConfig['shared_secret'])) {
        Response::error('Firma del webhook invalida', 401);
    }

    // Parsear el payload
    $payload = json_decode($rawPayload, true);
    if (!is_array($payload) || empty($payload['event'])) {
        Response::error('Payload invalido: se requiere campo event', 400);
    }

    $event = $payload['event'];

    switch ($event) {
        case 'enrollment_created':
            // Un estudiante fue inscrito en un curso del LMS
            if (empty($payload['email']) || empty($payload['session_id'])) {
                Response::error('Se requieren email y session_id para enrollment_created', 400);
            }

            $email = strtolower(trim($payload['email']));
            $sessionId = (int)$payload['session_id'];

            // Buscar usuario por email
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute(array($email));
            $targetUser = $stmt->fetch();

            if (!$targetUser) {
                // Crear usuario automaticamente
                $name = isset($payload['name']) ? trim($payload['name']) : 'Estudiante LMS';
                $randomPassword = bin2hex(random_bytes(16));
                $passwordHash = Auth::hashPassword($randomPassword);

                $stmt = $db->prepare(
                    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
                );
                $stmt->execute(array($name, $email, $passwordHash, 'estudiante'));
                $targetUserId = $db->lastInsertId();
            } else {
                $targetUserId = $targetUser['id'];
            }

            // Verificar que la sesion existe
            $stmt = $db->prepare('SELECT id FROM sessions WHERE id = ?');
            $stmt->execute(array($sessionId));
            if (!$stmt->fetch()) {
                Response::error('Sesion no encontrada: ' . $sessionId, 404);
            }

            // Inscribir si no esta inscrito
            $stmt = $db->prepare('SELECT id FROM session_students WHERE session_id = ? AND student_id = ?');
            $stmt->execute(array($sessionId, $targetUserId));
            if (!$stmt->fetch()) {
                $stmt = $db->prepare(
                    'INSERT INTO session_students (session_id, student_id, status) VALUES (?, ?, ?)'
                );
                $stmt->execute(array($sessionId, $targetUserId, 'activo'));
            }

            Response::success(array(
                'event' => $event,
                'user_id' => $targetUserId,
                'session_id' => $sessionId
            ), 'Inscripcion procesada');
            break;

        case 'enrollment_deleted':
            // Un estudiante fue des-inscrito del curso del LMS
            if (empty($payload['email']) || empty($payload['session_id'])) {
                Response::error('Se requieren email y session_id para enrollment_deleted', 400);
            }

            $email = strtolower(trim($payload['email']));
            $sessionId = (int)$payload['session_id'];

            // Buscar usuario por email
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute(array($email));
            $targetUser = $stmt->fetch();

            if ($targetUser) {
                // Eliminar inscripcion
                $stmt = $db->prepare(
                    'DELETE FROM session_students WHERE session_id = ? AND student_id = ?'
                );
                $stmt->execute(array($sessionId, $targetUser['id']));
            }

            Response::success(array(
                'event' => $event,
                'session_id' => $sessionId
            ), 'Des-inscripcion procesada');
            break;

        default:
            Response::error('Evento no soportado: ' . $event, 400);
            break;
    }
});
