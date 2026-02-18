<?php
/**
 * Rutas de progreso del usuario
 */

// GET /api/progress/me - Progreso del usuario actual
$router->get('/api/progress/me', function ($router) {
    $user = Middleware::authenticate();

    $db = Database::getInstance();

    // Datos actualizados del usuario
    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url FROM users WHERE id = ?');
    $stmt->execute(array($user['id']));
    $userData = $stmt->fetch();

    // Insignias del usuario
    $stmt = $db->prepare(
        'SELECT b.id, b.name, b.description, b.icon, b.category, ub.earned_at
         FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = ?
         ORDER BY ub.earned_at DESC'
    );
    $stmt->execute(array($user['id']));
    $badges = $stmt->fetchAll();

    // Insignias disponibles (no ganadas)
    $stmt = $db->prepare(
        'SELECT b.id, b.name, b.description, b.icon, b.category
         FROM badges b
         WHERE b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)'
    );
    $stmt->execute(array($user['id']));
    $availableBadges = $stmt->fetchAll();

    // Calcular XP para siguiente nivel
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

    $currentLevel = (int)$userData['level'];
    $currentXp = (int)$userData['xp'];
    $nextLevel = $currentLevel + 1;
    $xpForNextLevel = isset($levelThresholds[$nextLevel]) ? $levelThresholds[$nextLevel] : null;
    $xpCurrentLevel = isset($levelThresholds[$currentLevel]) ? $levelThresholds[$currentLevel] : 0;

    $progress = array(
        'current_xp' => $currentXp,
        'current_level' => $currentLevel,
        'xp_for_current_level' => $xpCurrentLevel,
        'xp_for_next_level' => $xpForNextLevel,
        'xp_remaining' => $xpForNextLevel !== null ? max(0, $xpForNextLevel - $currentXp) : 0,
        'is_max_level' => $xpForNextLevel === null
    );

    if ($xpForNextLevel !== null && ($xpForNextLevel - $xpCurrentLevel) > 0) {
        $progress['level_progress_percent'] = round(
            (($currentXp - $xpCurrentLevel) / ($xpForNextLevel - $xpCurrentLevel)) * 100,
            1
        );
    } else {
        $progress['level_progress_percent'] = 100;
    }

    // Estadisticas por rol
    $stats = array();
    if ($user['role'] === 'estudiante') {
        $stmt = $db->prepare('SELECT COUNT(*) as total FROM protocols WHERE student_id = ?');
        $stmt->execute(array($user['id']));
        $stats['total_protocols'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM protocols WHERE student_id = ? AND status = 'aprobado'");
        $stmt->execute(array($user['id']));
        $stats['approved_protocols'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM protocols WHERE student_id = ? AND status = 'en_progreso'");
        $stmt->execute(array($user['id']));
        $stats['in_progress_protocols'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare('SELECT COUNT(*) as total FROM session_students WHERE student_id = ?');
        $stmt->execute(array($user['id']));
        $stats['sessions_joined'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare(
            "SELECT COUNT(*) as total FROM micro_defenses md
             JOIN protocols p ON p.id = md.protocol_id
             WHERE p.student_id = ? AND md.status = 'aprobada'"
        );
        $stmt->execute(array($user['id']));
        $stats['defenses_passed'] = (int)$stmt->fetch()['total'];
    }

    Response::success(array(
        'user' => $userData,
        'level_progress' => $progress,
        'badges' => $badges,
        'available_badges' => $availableBadges,
        'stats' => $stats
    ));
});

// GET /api/progress/levels - Informacion de todos los niveles
$router->get('/api/progress/levels', function ($router) {
    $levels = array(
        array(
            'level' => 1,
            'name' => 'Novato Investigador',
            'xp_required' => 0,
            'description' => 'Estas comenzando tu viaje en la investigacion cientifica'
        ),
        array(
            'level' => 2,
            'name' => 'Aprendiz Curioso',
            'xp_required' => 100,
            'description' => 'Ya sabes formular preguntas basicas de investigacion'
        ),
        array(
            'level' => 3,
            'name' => 'Explorador Metodico',
            'xp_required' => 300,
            'description' => 'Comprendes la estructura de un protocolo de investigacion'
        ),
        array(
            'level' => 4,
            'name' => 'Analista en Formacion',
            'xp_required' => 600,
            'description' => 'Puedes identificar y definir variables correctamente'
        ),
        array(
            'level' => 5,
            'name' => 'Investigador Competente',
            'xp_required' => 1000,
            'description' => 'Dominas los fundamentos del diseno de investigacion'
        ),
        array(
            'level' => 6,
            'name' => 'Metodologista Habil',
            'xp_required' => 1500,
            'description' => 'Tus protocolos son coherentes y bien fundamentados'
        ),
        array(
            'level' => 7,
            'name' => 'Pensador Critico',
            'xp_required' => 2200,
            'description' => 'Defiendes tus hipotesis con argumentos solidos'
        ),
        array(
            'level' => 8,
            'name' => 'Investigador Avanzado',
            'xp_required' => 3000,
            'description' => 'Integras teoria y metodologia de forma efectiva'
        ),
        array(
            'level' => 9,
            'name' => 'Maestro Metodologico',
            'xp_required' => 4000,
            'description' => 'Eres un referente en diseno de investigacion'
        ),
        array(
            'level' => 10,
            'name' => 'Sabio Investigador',
            'xp_required' => 5500,
            'description' => 'Has alcanzado la maestria en metodologia de investigacion'
        )
    );

    Response::success($levels);
});

// GET /api/progress/activity - Registro de actividad del usuario
$router->get('/api/progress/activity', function ($router) {
    $user = Middleware::authenticate();
    $request = $router->getRequest();

    $limit = (int)$request->query('limit', 20);
    $offset = (int)$request->query('offset', 0);

    if ($limit > 100) {
        $limit = 100;
    }
    if ($limit < 1) {
        $limit = 20;
    }

    $db = Database::getInstance();

    // Total de registros
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM activity_log WHERE user_id = ?');
    $stmt->execute(array($user['id']));
    $total = (int)$stmt->fetch()['total'];

    // Obtener actividades
    $stmt = $db->prepare(
        'SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    $stmt->execute(array($user['id'], $limit, $offset));
    $activities = $stmt->fetchAll();

    // Decodificar detalles JSON
    foreach ($activities as &$activity) {
        $activity['details'] = json_decode($activity['details'], true);
    }
    unset($activity);

    Response::success(array(
        'activities' => $activities,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ));
});
