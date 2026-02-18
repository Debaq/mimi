<?php
/**
 * Rutas del dashboard del docente
 */

// GET /api/dashboard/overview - Estadisticas globales del docente
$router->get('/api/dashboard/overview', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $db = Database::getInstance();

    // Total sesiones del docente
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ?');
    $stmt->execute(array($user['id']));
    $totalSessions = (int)$stmt->fetch()['total'];

    // Sesiones activas
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ? AND status = 'activa'");
    $stmt->execute(array($user['id']));
    $activeSessions = (int)$stmt->fetch()['total'];

    // Total estudiantes unicos
    $stmt = $db->prepare(
        'SELECT COUNT(DISTINCT ss.student_id) as total
         FROM session_students ss
         JOIN sessions s ON s.id = ss.session_id
         WHERE s.teacher_id = ?'
    );
    $stmt->execute(array($user['id']));
    $totalStudents = (int)$stmt->fetch()['total'];

    // Total protocolos en sesiones del docente
    $stmt = $db->prepare(
        'SELECT COUNT(*) as total FROM protocols p
         JOIN sessions s ON s.id = p.session_id
         WHERE s.teacher_id = ?'
    );
    $stmt->execute(array($user['id']));
    $totalProtocols = (int)$stmt->fetch()['total'];

    // Protocolos pendientes de revision
    $stmt = $db->prepare(
        "SELECT COUNT(*) as total FROM protocols p
         JOIN sessions s ON s.id = p.session_id
         WHERE s.teacher_id = ? AND p.status = 'enviado'"
    );
    $stmt->execute(array($user['id']));
    $pendingReview = (int)$stmt->fetch()['total'];

    // Protocolos aprobados
    $stmt = $db->prepare(
        "SELECT COUNT(*) as total FROM protocols p
         JOIN sessions s ON s.id = p.session_id
         WHERE s.teacher_id = ? AND p.status = 'aprobado'"
    );
    $stmt->execute(array($user['id']));
    $approvedProtocols = (int)$stmt->fetch()['total'];

    // Distribucion de protocolos por estado
    $stmt = $db->prepare(
        'SELECT p.status, COUNT(*) as count FROM protocols p
         JOIN sessions s ON s.id = p.session_id
         WHERE s.teacher_id = ?
         GROUP BY p.status'
    );
    $stmt->execute(array($user['id']));
    $protocolDistribution = array();
    foreach ($stmt->fetchAll() as $row) {
        $protocolDistribution[$row['status']] = (int)$row['count'];
    }

    // Promedio de XP de estudiantes
    $stmt = $db->prepare(
        'SELECT AVG(u.xp) as avg_xp, AVG(u.level) as avg_level
         FROM users u
         WHERE u.id IN (
             SELECT DISTINCT ss.student_id FROM session_students ss
             JOIN sessions s ON s.id = ss.session_id
             WHERE s.teacher_id = ?
         )'
    );
    $stmt->execute(array($user['id']));
    $avgStats = $stmt->fetch();

    // Actividad reciente (ultimos 10 eventos de estudiantes del docente)
    $stmt = $db->prepare(
        'SELECT al.*, u.name as user_name
         FROM activity_log al
         JOIN users u ON u.id = al.user_id
         WHERE al.user_id IN (
             SELECT DISTINCT ss.student_id FROM session_students ss
             JOIN sessions s ON s.id = ss.session_id
             WHERE s.teacher_id = ?
         )
         ORDER BY al.created_at DESC LIMIT 10'
    );
    $stmt->execute(array($user['id']));
    $recentActivity = $stmt->fetchAll();
    foreach ($recentActivity as &$activity) {
        $activity['details'] = json_decode($activity['details'], true);
    }
    unset($activity);

    Response::success(array(
        'sessions' => array(
            'total' => $totalSessions,
            'active' => $activeSessions
        ),
        'students' => array(
            'total' => $totalStudents,
            'avg_xp' => $avgStats['avg_xp'] !== null ? round((float)$avgStats['avg_xp'], 1) : 0,
            'avg_level' => $avgStats['avg_level'] !== null ? round((float)$avgStats['avg_level'], 1) : 0
        ),
        'protocols' => array(
            'total' => $totalProtocols,
            'pending_review' => $pendingReview,
            'approved' => $approvedProtocols,
            'distribution' => $protocolDistribution
        ),
        'recent_activity' => $recentActivity
    ));
});

// GET /api/dashboard/students - Progreso de todos los estudiantes
$router->get('/api/dashboard/students', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $db = Database::getInstance();

    $sortBy = $request->query('sort', 'name');
    $order = $request->query('order', 'asc');

    $validSorts = array('name', 'level', 'xp');
    if (!in_array($sortBy, $validSorts)) {
        $sortBy = 'name';
    }
    $order = strtoupper($order) === 'DESC' ? 'DESC' : 'ASC';

    $sortColumn = 'u.' . $sortBy;

    $stmt = $db->prepare(
        'SELECT u.id, u.name, u.email, u.level, u.xp, u.avatar_url,
                (SELECT COUNT(*) FROM protocols p
                 JOIN sessions s ON s.id = p.session_id
                 WHERE p.student_id = u.id AND s.teacher_id = ?) as total_protocols,
                (SELECT COUNT(*) FROM protocols p
                 JOIN sessions s ON s.id = p.session_id
                 WHERE p.student_id = u.id AND s.teacher_id = ? AND p.status = ?) as approved_protocols,
                (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
                (SELECT COUNT(*) FROM session_students ss
                 JOIN sessions s ON s.id = ss.session_id
                 WHERE ss.student_id = u.id AND s.teacher_id = ?) as sessions_joined
         FROM users u
         WHERE u.id IN (
             SELECT DISTINCT ss.student_id FROM session_students ss
             JOIN sessions s ON s.id = ss.session_id
             WHERE s.teacher_id = ?
         )
         ORDER BY ' . $sortColumn . ' ' . $order
    );
    $stmt->execute(array($user['id'], $user['id'], 'aprobado', $user['id'], $user['id']));
    $students = $stmt->fetchAll();

    // Convertir conteos a enteros
    foreach ($students as &$student) {
        $student['total_protocols'] = (int)$student['total_protocols'];
        $student['approved_protocols'] = (int)$student['approved_protocols'];
        $student['badge_count'] = (int)$student['badge_count'];
        $student['sessions_joined'] = (int)$student['sessions_joined'];
    }
    unset($student);

    Response::success($students);
});

// GET /api/dashboard/session/{id} - Analiticas de sesion especifica
$router->get('/api/dashboard/session/{id}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    // Verificar que la sesion pertenece al docente
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND teacher_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada o no tienes permisos', 404);
    }

    $session['config'] = json_decode($session['config'], true);

    // Estudiantes inscritos
    $stmt = $db->prepare(
        'SELECT u.id, u.name, u.email, u.level, u.xp,
                ss.status as enrollment_status, ss.joined_at
         FROM session_students ss
         JOIN users u ON u.id = ss.student_id
         WHERE ss.session_id = ?
         ORDER BY ss.joined_at ASC'
    );
    $stmt->execute(array($sessionId));
    $students = $stmt->fetchAll();

    // Protocolos de la sesion
    $stmt = $db->prepare(
        'SELECT p.*, u.name as student_name
         FROM protocols p
         JOIN users u ON u.id = p.student_id
         WHERE p.session_id = ?
         ORDER BY p.created_at DESC'
    );
    $stmt->execute(array($sessionId));
    $protocols = $stmt->fetchAll();

    // Decodificar campos JSON de protocolos
    foreach ($protocols as &$protocol) {
        $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
        $protocol['variables'] = json_decode($protocol['variables'], true);
        $protocol['research_design'] = json_decode($protocol['research_design'], true);
        $protocol['sample'] = json_decode($protocol['sample'], true);
        $protocol['instruments'] = json_decode($protocol['instruments'], true);
    }
    unset($protocol);

    // Estadisticas de protocolos
    $protocolStats = array(
        'total' => count($protocols),
        'en_progreso' => 0,
        'enviado' => 0,
        'aprobado' => 0,
        'rechazado' => 0
    );
    $totalSteps = 0;
    $totalXp = 0;

    foreach ($protocols as $p) {
        $status = $p['status'];
        if (isset($protocolStats[$status])) {
            $protocolStats[$status]++;
        }
        $totalSteps += (int)$p['current_step'];
        $totalXp += (int)$p['xp_earned'];
    }

    $protocolStats['avg_step'] = count($protocols) > 0 ? round($totalSteps / count($protocols), 1) : 0;
    $protocolStats['avg_xp'] = count($protocols) > 0 ? round($totalXp / count($protocols), 1) : 0;

    // Distribucion de pasos actuales
    $stepDistribution = array();
    for ($i = 1; $i <= 7; $i++) {
        $stepDistribution[$i] = 0;
    }
    foreach ($protocols as $p) {
        $step = (int)$p['current_step'];
        if (isset($stepDistribution[$step])) {
            $stepDistribution[$step]++;
        }
    }

    // Problemas comunes en validaciones
    $stmt = $db->prepare(
        "SELECT v.field, v.status, COUNT(*) as count
         FROM validations v
         JOIN protocols p ON p.id = v.protocol_id
         WHERE p.session_id = ? AND v.status = 'incoherente'
         GROUP BY v.field
         ORDER BY count DESC
         LIMIT 10"
    );
    $stmt->execute(array($sessionId));
    $commonIssues = $stmt->fetchAll();

    Response::success(array(
        'session' => $session,
        'students' => $students,
        'protocols' => $protocols,
        'stats' => array(
            'students_count' => count($students),
            'protocol_stats' => $protocolStats,
            'step_distribution' => $stepDistribution,
            'common_issues' => $commonIssues
        )
    ));
});
