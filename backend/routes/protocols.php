<?php
/**
 * Rutas de protocolos de investigacion
 */

// POST /api/protocols - Crear protocolo (solo estudiante)
$router->post('/api/protocols', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['session_id'])) {
        Response::error('session_id es requerido', 400);
    }

    $db = Database::getInstance();

    // Verificar que esta inscrito en la sesion
    $stmt = $db->prepare(
        'SELECT ss.id FROM session_students ss
         JOIN sessions s ON s.id = ss.session_id
         WHERE ss.session_id = ? AND ss.student_id = ? AND s.status = ?'
    );
    $stmt->execute(array($body['session_id'], $user['id'], 'activa'));
    if (!$stmt->fetch()) {
        Response::error('No estas inscrito en esta sesion o la sesion no esta activa', 403);
    }

    // Verificar si ya tiene un protocolo en esta sesion
    $stmt = $db->prepare('SELECT id FROM protocols WHERE session_id = ? AND student_id = ?');
    $stmt->execute(array($body['session_id'], $user['id']));
    $existing = $stmt->fetch();

    if ($existing) {
        // Verificar si la sesion permite reintentos
        $stmt = $db->prepare('SELECT allow_retries FROM sessions WHERE id = ?');
        $stmt->execute(array($body['session_id']));
        $session = $stmt->fetch();

        if (!$session['allow_retries'] || !in_array($body['force_new'], array(true, 1, '1'), true)) {
            Response::error('Ya tienes un protocolo en esta sesion', 409, array('protocol_id' => $existing['id']));
        }
    }

    // Obtener el problem_statement de la sesion si existe
    $stmt = $db->prepare('SELECT problem_statement FROM sessions WHERE id = ?');
    $stmt->execute(array($body['session_id']));
    $session = $stmt->fetch();

    $stmt = $db->prepare(
        'INSERT INTO protocols (student_id, session_id, status, current_step, problem_statement)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        $body['session_id'],
        'en_progreso',
        1,
        $session['problem_statement']
    ));

    $protocolId = $db->lastInsertId();

    // Otorgar XP por iniciar protocolo
    $xpEarned = 15;
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'crear_protocolo',
        $xpEarned,
        json_encode(array('protocol_id' => $protocolId, 'session_id' => $body['session_id']))
    ));

    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    Response::success(array(
        'protocol' => $protocol,
        'xp_earned' => $xpEarned
    ), 'Protocolo creado exitosamente');
});

// GET /api/protocols/{id} - Obtener protocolo
$router->get('/api/protocols/{id}', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare(
        'SELECT p.*, u.name as student_name, s.title as session_title, s.mode as session_mode
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

    // Verificar acceso: dueno del protocolo o docente de la sesion
    if ($user['role'] === 'estudiante' && $protocol['student_id'] != $user['id']) {
        Response::error('No tienes acceso a este protocolo', 403);
    }

    if ($user['role'] === 'docente') {
        $stmt = $db->prepare('SELECT teacher_id FROM sessions WHERE id = ?');
        $stmt->execute(array($protocol['session_id']));
        $session = $stmt->fetch();
        if ($session['teacher_id'] != $user['id']) {
            Response::error('No tienes acceso a este protocolo', 403);
        }
    }

    // Decodificar campos JSON
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    // Obtener validaciones
    $stmt = $db->prepare('SELECT * FROM validations WHERE protocol_id = ? ORDER BY created_at DESC');
    $stmt->execute(array($protocolId));
    $protocol['validations'] = $stmt->fetchAll();

    // Obtener micro defensas
    $stmt = $db->prepare('SELECT * FROM micro_defenses WHERE protocol_id = ? ORDER BY created_at DESC');
    $stmt->execute(array($protocolId));
    $protocol['micro_defenses'] = $stmt->fetchAll();

    Response::success($protocol);
});

// PUT /api/protocols/{id} - Actualizar campos del protocolo
$router->put('/api/protocols/{id}', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    // Obtener protocolo
    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    // Solo el dueno o docente puede editar
    if ($user['role'] === 'estudiante' && $protocol['student_id'] != $user['id']) {
        Response::error('No tienes permisos para editar este protocolo', 403);
    }

    // No editar protocolos enviados (a menos que sea docente)
    if ($protocol['status'] === 'enviado' && $user['role'] !== 'docente') {
        Response::error('El protocolo ya fue enviado y no puede editarse', 400);
    }

    // Campos actualizables
    $fields = array();
    $values = array();

    $textFields = array('problem_statement', 'research_question', 'general_objective', 'hypothesis', 'theoretical_framework', 'justification');
    foreach ($textFields as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = $field . ' = ?';
            $values[] = $body[$field];
        }
    }

    $jsonFields = array('specific_objectives', 'variables', 'research_design', 'sample', 'instruments');
    foreach ($jsonFields as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = $field . ' = ?';
            $values[] = json_encode($body[$field]);
        }
    }

    if (array_key_exists('current_step', $body)) {
        $step = (int)$body['current_step'];
        if ($step >= 1 && $step <= 7) {
            $fields[] = 'current_step = ?';
            $values[] = $step;
        }
    }

    if (empty($fields)) {
        Response::error('No se proporcionaron campos para actualizar', 400);
    }

    $fields[] = 'updated_at = CURRENT_TIMESTAMP';
    $values[] = $protocolId;

    $sql = 'UPDATE protocols SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    // Calcular XP por avance de paso
    if (array_key_exists('current_step', $body)) {
        $newStep = (int)$body['current_step'];
        $oldStep = (int)$protocol['current_step'];
        if ($newStep > $oldStep) {
            $xpEarned = ($newStep - $oldStep) * 20;
            $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
            $stmt->execute(array($xpEarned, $protocol['student_id']));

            $stmt = $db->prepare('UPDATE protocols SET xp_earned = xp_earned + ? WHERE id = ?');
            $stmt->execute(array($xpEarned, $protocolId));

            $stmt = $db->prepare(
                'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute(array(
                $protocol['student_id'],
                'avance_protocolo',
                $xpEarned,
                json_encode(array('protocol_id' => $protocolId, 'from_step' => $oldStep, 'to_step' => $newStep))
            ));

            // Verificar subida de nivel
            checkLevelUp($db, $protocol['student_id']);
        }
    }

    // Obtener protocolo actualizado
    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $updated = $stmt->fetch();
    $updated['specific_objectives'] = json_decode($updated['specific_objectives'], true);
    $updated['variables'] = json_decode($updated['variables'], true);
    $updated['research_design'] = json_decode($updated['research_design'], true);
    $updated['sample'] = json_decode($updated['sample'], true);
    $updated['instruments'] = json_decode($updated['instruments'], true);

    Response::success($updated, 'Protocolo actualizado exitosamente');
});

// POST /api/protocols/{id}/validate - Validar coherencia del protocolo
$router->post('/api/protocols/{id}/validate', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    // Decodificar JSON
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    $validator = new CoherenceValidator();

    // Validar paso especifico o todo
    $step = isset($body['step']) ? (int)$body['step'] : null;
    if ($step !== null) {
        $results = $validator->validateStep($protocol, $step);
    } else {
        $results = $validator->validateAll($protocol);
    }

    // Guardar resultados de validacion en BD
    // Eliminar validaciones previas del protocolo
    $stmt = $db->prepare('DELETE FROM validations WHERE protocol_id = ?');
    $stmt->execute(array($protocolId));

    // Insertar nuevas
    $stmtInsert = $db->prepare(
        'INSERT INTO validations (protocol_id, field, status, message, suggestion) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($results as $result) {
        $stmtInsert->execute(array(
            $protocolId,
            $result['field'],
            $result['status'],
            $result['message'],
            isset($result['suggestion']) ? $result['suggestion'] : null
        ));
    }

    // XP por ejecutar validacion
    $xpEarned = 5;
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'validar_protocolo',
        $xpEarned,
        json_encode(array('protocol_id' => $protocolId, 'results_count' => count($results)))
    ));

    Response::success(array(
        'validations' => $results,
        'xp_earned' => $xpEarned
    ), 'Validacion completada');
});

// POST /api/protocols/{id}/submit - Enviar protocolo para revision
$router->post('/api/protocols/{id}/submit', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $protocolId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ? AND student_id = ?');
    $stmt->execute(array($protocolId, $user['id']));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    if ($protocol['status'] !== 'en_progreso') {
        Response::error('Solo se pueden enviar protocolos en progreso', 400);
    }

    // Verificar que al menos tenga campos basicos (hypothesis es opcional)
    $required = array('problem_statement', 'research_question', 'general_objective');
    $missing = array();
    foreach ($required as $field) {
        if (empty($protocol[$field])) {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        Response::error(
            'El protocolo esta incompleto. Faltan: ' . implode(', ', $missing),
            400,
            array('missing_fields' => $missing)
        );
    }

    // Actualizar estado
    $stmt = $db->prepare('UPDATE protocols SET status = ?, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute(array('enviado', $protocolId));

    // XP por enviar
    $xpEarned = 50;
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    $stmt = $db->prepare('UPDATE protocols SET xp_earned = xp_earned + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $protocolId));

    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'enviar_protocolo',
        $xpEarned,
        json_encode(array('protocol_id' => $protocolId))
    ));

    checkLevelUp($db, $user['id']);
    checkBadges($db, $user['id']);

    Response::success(array('xp_earned' => $xpEarned), 'Protocolo enviado para revision');
});

// PUT /api/protocols/{id}/review - Revisar protocolo (solo docente)
$router->put('/api/protocols/{id}/review', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $protocolId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['status']) || !in_array($body['status'], array('aprobado', 'rechazado'))) {
        Response::error('status debe ser aprobado o rechazado', 400);
    }

    $db = Database::getInstance();

    // Verificar que el protocolo pertenece a una sesion del docente
    $stmt = $db->prepare(
        'SELECT p.* FROM protocols p
         JOIN sessions s ON s.id = p.session_id
         WHERE p.id = ? AND s.teacher_id = ?'
    );
    $stmt->execute(array($protocolId, $user['id']));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado o no tienes permisos', 404);
    }

    if ($protocol['status'] !== 'enviado') {
        Response::error('Solo se pueden revisar protocolos enviados', 400);
    }

    $newStatus = $body['status'];
    $feedback = isset($body['feedback']) ? $body['feedback'] : null;

    $stmt = $db->prepare('UPDATE protocols SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute(array($newStatus, $protocolId));

    // Si fue aprobado, dar XP extra al estudiante
    if ($newStatus === 'aprobado') {
        $xpEarned = 100;
        $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
        $stmt->execute(array($xpEarned, $protocol['student_id']));

        $stmt = $db->prepare('UPDATE protocols SET xp_earned = xp_earned + ? WHERE id = ?');
        $stmt->execute(array($xpEarned, $protocolId));

        $stmt = $db->prepare(
            'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $protocol['student_id'],
            'protocolo_aprobado',
            $xpEarned,
            json_encode(array('protocol_id' => $protocolId, 'reviewer' => $user['name']))
        ));

        // Actualizar estado de inscripcion
        $stmt = $db->prepare(
            'UPDATE session_students SET status = ? WHERE session_id = ? AND student_id = ?'
        );
        $stmt->execute(array('completado', $protocol['session_id'], $protocol['student_id']));

        checkLevelUp($db, $protocol['student_id']);
        checkBadges($db, $protocol['student_id']);
    } else {
        // Rechazado - registrar con feedback
        $stmt = $db->prepare(
            'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $protocol['student_id'],
            'protocolo_rechazado',
            0,
            json_encode(array('protocol_id' => $protocolId, 'feedback' => $feedback))
        ));
    }

    // Si hay feedback, guardarlo como validacion
    if ($feedback) {
        $stmt = $db->prepare(
            'INSERT INTO validations (protocol_id, field, status, message) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $protocolId,
            'revision_docente',
            $newStatus === 'aprobado' ? 'valido' : 'incoherente',
            $feedback
        ));
    }

    Response::success(null, 'Protocolo ' . $newStatus . ' exitosamente');
});

// POST /api/protocols/{id}/defense - Generar micro defensa
$router->post('/api/protocols/{id}/defense', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    // Decodificar JSON
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    $step = isset($body['step']) ? (int)$body['step'] : $protocol['current_step'];

    $generator = new MicroDefenseGenerator();
    $objection = $generator->generateForStep($protocol, $step);

    // Guardar en BD
    $stmt = $db->prepare(
        'INSERT INTO micro_defenses (protocol_id, step, objection, status) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array($protocolId, $step, $objection, 'pendiente'));
    $defenseId = $db->lastInsertId();

    Response::success(array(
        'defense_id' => (int)$defenseId,
        'step' => $step,
        'objection' => $objection
    ), 'Objecion generada');
});

// PUT /api/defenses/{id} - Responder micro defensa
$router->put('/api/defenses/{id}', function ($router) {
    $user = Middleware::authenticate();
    $defenseId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['response'])) {
        Response::error('La respuesta es requerida', 400);
    }

    $db = Database::getInstance();

    $stmt = $db->prepare(
        'SELECT md.*, p.student_id FROM micro_defenses md
         JOIN protocols p ON p.id = md.protocol_id
         WHERE md.id = ?'
    );
    $stmt->execute(array($defenseId));
    $defense = $stmt->fetch();

    if (!$defense) {
        Response::error('Micro defensa no encontrada', 404);
    }

    if ($defense['status'] !== 'pendiente') {
        Response::error('Esta micro defensa ya fue respondida', 400);
    }

    $generator = new MicroDefenseGenerator();
    $score = $generator->evaluateResponse($defenseId, $body['response']);

    $status = $score >= 60 ? 'aprobada' : 'respondida';

    $stmt = $db->prepare(
        'UPDATE micro_defenses SET student_response = ?, score = ?, status = ? WHERE id = ?'
    );
    $stmt->execute(array($body['response'], $score, $status, $defenseId));

    // XP por responder defensa
    $xpEarned = $score >= 60 ? 30 : 10;
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $defense['student_id']));

    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $defense['student_id'],
        'responder_defensa',
        $xpEarned,
        json_encode(array('defense_id' => $defenseId, 'score' => $score, 'status' => $status))
    ));

    checkLevelUp($db, $defense['student_id']);
    checkBadges($db, $defense['student_id']);

    Response::success(array(
        'score' => $score,
        'status' => $status,
        'xp_earned' => $xpEarned
    ), $status === 'aprobada' ? 'Defensa aprobada' : 'Respuesta registrada, intenta mejorar tu argumento');
});

// GET /api/sessions/{id}/protocol - Obtener el protocolo del estudiante en una sesion
$router->get('/api/sessions/{id}/protocol', function ($router) {
    $user = Middleware::authenticate();
    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM protocols WHERE session_id = ? AND student_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('No tienes un protocolo en esta sesion', 404);
    }

    // Decodificar campos JSON
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    // Obtener validaciones
    $stmt = $db->prepare('SELECT * FROM validations WHERE protocol_id = ? ORDER BY created_at DESC');
    $stmt->execute(array($protocol['id']));
    $protocol['validations'] = $stmt->fetchAll();

    // Obtener micro defensas
    $stmt = $db->prepare('SELECT * FROM micro_defenses WHERE protocol_id = ? ORDER BY created_at DESC');
    $stmt->execute(array($protocol['id']));
    $protocol['micro_defenses'] = $stmt->fetchAll();

    Response::success($protocol);
});

/**
 * Verificar y aplicar subida de nivel
 *
 * @param PDO $db
 * @param int $userId
 */
function checkLevelUp($db, $userId)
{
    $stmt = $db->prepare('SELECT level, xp FROM users WHERE id = ?');
    $stmt->execute(array($userId));
    $user = $stmt->fetch();

    if (!$user) {
        return;
    }

    // Tabla de niveles: XP requerido para cada nivel
    $levelThresholds = array(
        1 => 0,
        2 => 100,
        3 => 300,
        4 => 600,
        5 => 1000,
        6 => 1500,
        7 => 2200,
        8 => 3000,
        9 => 4000,
        10 => 5500
    );

    $currentLevel = (int)$user['level'];
    $currentXp = (int)$user['xp'];
    $newLevel = $currentLevel;

    // Determinar nuevo nivel
    foreach ($levelThresholds as $level => $threshold) {
        if ($currentXp >= $threshold) {
            $newLevel = $level;
        }
    }

    if ($newLevel > $currentLevel) {
        $stmt = $db->prepare('UPDATE users SET level = ? WHERE id = ?');
        $stmt->execute(array($newLevel, $userId));

        $stmt = $db->prepare(
            'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute(array(
            $userId,
            'subir_nivel',
            0,
            json_encode(array('from_level' => $currentLevel, 'to_level' => $newLevel))
        ));
    }
}

/**
 * Verificar y otorgar insignias
 *
 * @param PDO $db
 * @param int $userId
 */
function checkBadges($db, $userId)
{
    // Semilla Metodologica: primer protocolo completado
    $stmt = $db->prepare('SELECT COUNT(*) as c FROM protocols WHERE student_id = ? AND status = ?');
    $stmt->execute(array($userId, 'aprobado'));
    $approved = (int)$stmt->fetch()['c'];

    if ($approved >= 1) {
        awardBadge($db, $userId, 'Semilla Metodologica');
    }

    // Observador Sistematico: variables validas en 3 protocolos
    $stmt = $db->prepare(
        "SELECT COUNT(*) as c FROM validations v
         JOIN protocols p ON p.id = v.protocol_id
         WHERE p.student_id = ? AND v.field = 'variables' AND v.status = 'valido'"
    );
    $stmt->execute(array($userId));
    $validVars = (int)$stmt->fetch()['c'];

    if ($validVars >= 3) {
        awardBadge($db, $userId, 'Observador Sistematico');
    }

    // Defensor de Hipotesis: 5 micro defensas aprobadas
    $stmt = $db->prepare(
        'SELECT COUNT(*) as c FROM micro_defenses md
         JOIN protocols p ON p.id = md.protocol_id
         WHERE p.student_id = ? AND md.status = ?'
    );
    $stmt->execute(array($userId, 'aprobada'));
    $defensesPassed = (int)$stmt->fetch()['c'];

    if ($defensesPassed >= 5) {
        awardBadge($db, $userId, 'Defensor de Hipotesis');
    }

    // Constructor Coherente: validacion perfecta en un protocolo
    $stmt = $db->prepare(
        'SELECT p.id FROM protocols p WHERE p.student_id = ? AND p.id NOT IN (
            SELECT DISTINCT protocol_id FROM validations WHERE status != ?
        ) AND p.id IN (
            SELECT DISTINCT protocol_id FROM validations WHERE status = ?
        )'
    );
    $stmt->execute(array($userId, 'valido', 'valido'));
    $perfectProtocol = $stmt->fetch();

    if ($perfectProtocol) {
        awardBadge($db, $userId, 'Constructor Coherente');
    }
}

/**
 * Otorgar insignia a un usuario si no la tiene
 *
 * @param PDO $db
 * @param int $userId
 * @param string $badgeName
 */
function awardBadge($db, $userId, $badgeName)
{
    $stmt = $db->prepare('SELECT id FROM badges WHERE name = ?');
    $stmt->execute(array($badgeName));
    $badge = $stmt->fetch();

    if (!$badge) {
        return;
    }

    // Verificar si ya la tiene
    $stmt = $db->prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?');
    $stmt->execute(array($userId, $badge['id']));
    if ($stmt->fetch()) {
        return;
    }

    $stmt = $db->prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)');
    $stmt->execute(array($userId, $badge['id']));

    // XP bonus por insignia
    $xpBonus = 50;
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpBonus, $userId));

    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $userId,
        'insignia_obtenida',
        $xpBonus,
        json_encode(array('badge' => $badgeName))
    ));
}
