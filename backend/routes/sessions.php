<?php
/**
 * Rutas de sesiones
 */

// GET /api/sessions - Listar sesiones
$router->get('/api/sessions', function ($router) {
    $user = Middleware::authenticate();
    $request = $router->getRequest();
    $db = Database::getInstance();

    if ($user['role'] === 'docente') {
        // Docentes ven sus propias sesiones
        $stmt = $db->prepare(
            'SELECT s.*,
                    (SELECT COUNT(*) FROM session_students ss WHERE ss.session_id = s.id) as student_count
             FROM sessions s
             WHERE s.teacher_id = ?
             ORDER BY s.created_at DESC'
        );
        $stmt->execute(array($user['id']));
    } else {
        // Estudiantes ven sesiones activas y las que ya estan inscritos
        $status = $request->query('status', 'activa');
        $stmt = $db->prepare(
            'SELECT s.*,
                    (SELECT COUNT(*) FROM session_students ss WHERE ss.session_id = s.id) as student_count,
                    (SELECT ss2.status FROM session_students ss2 WHERE ss2.session_id = s.id AND ss2.student_id = ?) as enrollment_status
             FROM sessions s
             WHERE s.status = ? OR s.id IN (SELECT session_id FROM session_students WHERE student_id = ?)
             ORDER BY s.created_at DESC'
        );
        $stmt->execute(array($user['id'], $status, $user['id']));
    }

    $sessions = $stmt->fetchAll();

    // Decodificar campos JSON
    foreach ($sessions as &$session) {
        $session['config'] = json_decode($session['config'], true);
    }
    unset($session);

    Response::success($sessions);
});

// POST /api/sessions - Crear sesion (solo docente)
$router->post('/api/sessions', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $errors = array();
    if (empty($body['title'])) {
        $errors[] = 'El titulo es requerido';
    }
    if (!empty($body['mode']) && !in_array($body['mode'], array('constructor', 'detective', 'laboratorio'))) {
        $errors[] = 'Modo invalido. Debe ser: constructor, detective o laboratorio';
    }

    if (!empty($errors)) {
        Response::error('Datos invalidos', 400, $errors);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare(
        'INSERT INTO sessions (teacher_id, title, description, mode, difficulty, status, config, problem_statement, start_date, end_date, allow_retries, show_hints)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $mode = isset($body['mode']) ? $body['mode'] : 'constructor';
    $difficulty = isset($body['difficulty']) ? (int)$body['difficulty'] : 1;
    $status = isset($body['status']) ? $body['status'] : 'borrador';
    $config = isset($body['config']) ? json_encode($body['config']) : '{}';
    $problemStatement = isset($body['problem_statement']) ? $body['problem_statement'] : null;
    $startDate = isset($body['start_date']) ? $body['start_date'] : null;
    $endDate = isset($body['end_date']) ? $body['end_date'] : null;
    $allowRetries = isset($body['allow_retries']) ? (int)$body['allow_retries'] : 1;
    $showHints = isset($body['show_hints']) ? (int)$body['show_hints'] : 1;

    $stmt->execute(array(
        $user['id'],
        trim($body['title']),
        isset($body['description']) ? trim($body['description']) : null,
        $mode,
        $difficulty,
        $status,
        $config,
        $problemStatement,
        $startDate,
        $endDate,
        $allowRetries,
        $showHints
    ));

    $sessionId = $db->lastInsertId();

    // Obtener sesion creada
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ?');
    $stmt->execute(array($sessionId));
    $session = $stmt->fetch();
    $session['config'] = json_decode($session['config'], true);

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'crear_sesion',
        json_encode(array('session_id' => $sessionId, 'title' => $body['title']))
    ));

    Response::success($session, 'Sesion creada exitosamente');
});

// GET /api/sessions/{id} - Detalle de sesion
$router->get('/api/sessions/{id}', function ($router) {
    $user = Middleware::authenticate();
    $sessionId = $router->getParam('id');

    $db = Database::getInstance();
    $stmt = $db->prepare(
        'SELECT s.*,
                u.name as teacher_name,
                (SELECT COUNT(*) FROM session_students ss WHERE ss.session_id = s.id) as student_count
         FROM sessions s
         JOIN users u ON u.id = s.teacher_id
         WHERE s.id = ?'
    );
    $stmt->execute(array($sessionId));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada', 404);
    }

    $session['config'] = json_decode($session['config'], true);

    // Si es docente dueno, incluir estadisticas
    if ($user['role'] === 'docente' && $session['teacher_id'] == $user['id']) {
        $stmt = $db->prepare(
            'SELECT p.status, COUNT(*) as count FROM protocols p WHERE p.session_id = ? GROUP BY p.status'
        );
        $stmt->execute(array($sessionId));
        $protocolStats = array();
        foreach ($stmt->fetchAll() as $row) {
            $protocolStats[$row['status']] = (int)$row['count'];
        }
        $session['protocol_stats'] = $protocolStats;
    }

    // Si es estudiante, incluir su estado de inscripcion
    if ($user['role'] === 'estudiante') {
        $stmt = $db->prepare('SELECT status FROM session_students WHERE session_id = ? AND student_id = ?');
        $stmt->execute(array($sessionId, $user['id']));
        $enrollment = $stmt->fetch();
        $session['enrollment_status'] = $enrollment ? $enrollment['status'] : null;

        // Incluir protocolo del estudiante si existe
        $stmt = $db->prepare('SELECT id, status, current_step FROM protocols WHERE session_id = ? AND student_id = ?');
        $stmt->execute(array($sessionId, $user['id']));
        $session['my_protocol'] = $stmt->fetch();
    }

    Response::success($session);
});

// PUT /api/sessions/{id} - Actualizar sesion (solo docente dueno)
$router->put('/api/sessions/{id}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $sessionId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    // Verificar que la sesion existe y pertenece al docente
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    // Construir query de actualizacion dinamica
    $fields = array();
    $values = array();

    $updatable = array('title', 'description', 'mode', 'difficulty', 'status', 'problem_statement', 'start_date', 'end_date', 'allow_retries', 'show_hints');

    foreach ($updatable as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = $field . ' = ?';
            $values[] = $body[$field];
        }
    }

    if (array_key_exists('config', $body)) {
        $fields[] = 'config = ?';
        $values[] = json_encode($body['config']);
    }

    if (empty($fields)) {
        Response::error('No se proporcionaron campos para actualizar', 400);
    }

    $values[] = $sessionId;
    $sql = 'UPDATE sessions SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    // Obtener sesion actualizada
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ?');
    $stmt->execute(array($sessionId));
    $session = $stmt->fetch();
    $session['config'] = json_decode($session['config'], true);

    Response::success($session, 'Sesion actualizada exitosamente');
});

// DELETE /api/sessions/{id} - Eliminar sesion (solo docente dueno)
$router->delete('/api/sessions/{id}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    // Verificar propiedad
    $stmt = $db->prepare('SELECT id FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    if (!$stmt->fetch()) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    $stmt = $db->prepare('DELETE FROM sessions WHERE id = ?');
    $stmt->execute(array($sessionId));

    Response::success(null, 'Sesion eliminada exitosamente');
});

// POST /api/sessions/{id}/join - Unirse a sesion (solo estudiante)
$router->post('/api/sessions/{id}/join', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    // Verificar que la sesion existe y esta activa
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND status = ?');
    $stmt->execute(array($sessionId, 'activa'));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('La sesion no existe o no esta activa', 404);
    }

    // Verificar si ya esta inscrito
    $stmt = $db->prepare('SELECT id FROM session_students WHERE session_id = ? AND student_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    if ($stmt->fetch()) {
        Response::error('Ya estas inscrito en esta sesion', 409);
    }

    // Inscribir estudiante
    $stmt = $db->prepare('INSERT INTO session_students (session_id, student_id, status) VALUES (?, ?, ?)');
    $stmt->execute(array($sessionId, $user['id'], 'activo'));

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'session_joined',
        0,
        json_encode(array('session_id' => $sessionId, 'title' => $session['title']))
    ));

    Response::success(array('xp_earned' => 0), 'Te has unido a la sesion exitosamente');
});

// GET /api/sessions/{id}/students - Listar estudiantes de sesion (solo docente)
$router->get('/api/sessions/{id}/students', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    // Verificar que la sesion pertenece al docente
    $stmt = $db->prepare('SELECT id FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    if (!$stmt->fetch()) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    // Obtener estudiantes con su progreso
    $stmt = $db->prepare(
        'SELECT u.id, u.name, u.email, u.level, u.xp, u.avatar_url,
                ss.status as enrollment_status, ss.joined_at,
                (SELECT p.status FROM protocols p WHERE p.session_id = ? AND p.student_id = u.id LIMIT 1) as protocol_status,
                (SELECT p.current_step FROM protocols p WHERE p.session_id = ? AND p.student_id = u.id LIMIT 1) as protocol_step
         FROM session_students ss
         JOIN users u ON u.id = ss.student_id
         WHERE ss.session_id = ?
         ORDER BY ss.joined_at ASC'
    );
    $stmt->execute(array($sessionId, $sessionId, $sessionId));
    $students = $stmt->fetchAll();

    Response::success($students);
});
