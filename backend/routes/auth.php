<?php
/**
 * Rutas de autenticacion
 */

// POST /api/auth/register - Registrar nuevo usuario
$router->post('/api/auth/register', function ($router) {
    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $errors = array();
    if (empty($body['name'])) {
        $errors[] = 'El nombre es requerido';
    }
    if (empty($body['email'])) {
        $errors[] = 'El email es requerido';
    } elseif (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'El email no es valido';
    }
    if (empty($body['password'])) {
        $errors[] = 'La contrasena es requerida';
    } elseif (strlen($body['password']) < 6) {
        $errors[] = 'La contrasena debe tener al menos 6 caracteres';
    }
    if (empty($body['role'])) {
        $errors[] = 'El rol es requerido';
    } elseif (!in_array($body['role'], array('estudiante', 'docente'))) {
        $errors[] = 'El rol debe ser estudiante o docente';
    }

    if (!empty($errors)) {
        Response::error('Datos de registro invalidos', 400, $errors);
    }

    $db = Database::getInstance();

    // Verificar email duplicado
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(array($body['email']));
    if ($stmt->fetch()) {
        Response::error('El email ya esta registrado', 409);
    }

    // Crear usuario
    $passwordHash = Auth::hashPassword($body['password']);
    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        trim($body['name']),
        strtolower(trim($body['email'])),
        $passwordHash,
        $body['role']
    ));

    $userId = $db->lastInsertId();

    // Obtener usuario creado
    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute(array($userId));
    $user = $stmt->fetch();

    // Generar token
    $token = Auth::generateToken($user);

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $userId,
        'registro',
        0,
        json_encode(array('role' => $body['role']))
    ));

    Response::success(array(
        'token' => $token,
        'user' => $user
    ), 'Usuario registrado exitosamente');
});

// POST /api/auth/login - Iniciar sesion
$router->post('/api/auth/login', function ($router) {
    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos
    if (empty($body['email']) || empty($body['password'])) {
        Response::error('Email y contrasena son requeridos', 400);
    }

    $db = Database::getInstance();

    // Buscar usuario
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute(array(strtolower(trim($body['email']))));
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('Credenciales invalidas', 401);
    }

    // Verificar contrasena
    if (!Auth::verifyPassword($body['password'], $user['password_hash'])) {
        Response::error('Credenciales invalidas', 401);
    }

    // Generar token
    $token = Auth::generateToken($user);

    // Datos de usuario sin password
    unset($user['password_hash']);

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'login',
        0,
        json_encode(array('timestamp' => date('Y-m-d H:i:s')))
    ));

    Response::success(array(
        'token' => $token,
        'user' => $user
    ), 'Inicio de sesion exitoso');
});

// GET /api/auth/me - Obtener info del usuario actual
$router->get('/api/auth/me', function ($router) {
    $user = Middleware::authenticate();

    $db = Database::getInstance();

    // Obtener insignias del usuario
    $stmt = $db->prepare(
        'SELECT b.id, b.name, b.description, b.icon, b.category, ub.earned_at
         FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = ?
         ORDER BY ub.earned_at DESC'
    );
    $stmt->execute(array($user['id']));
    $badges = $stmt->fetchAll();

    // Estadisticas del usuario
    $stats = array();
    if ($user['role'] === 'estudiante') {
        $stmt = $db->prepare('SELECT COUNT(*) as total FROM protocols WHERE student_id = ?');
        $stmt->execute(array($user['id']));
        $stats['total_protocols'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare('SELECT COUNT(*) as total FROM protocols WHERE student_id = ? AND status = ?');
        $stmt->execute(array($user['id'], 'aprobado'));
        $stats['approved_protocols'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare('SELECT COUNT(*) as total FROM micro_defenses md JOIN protocols p ON p.id = md.protocol_id WHERE p.student_id = ? AND md.status = ?');
        $stmt->execute(array($user['id'], 'aprobada'));
        $stats['defenses_passed'] = (int)$stmt->fetch()['total'];
    } else {
        $stmt = $db->prepare('SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ?');
        $stmt->execute(array($user['id']));
        $stats['total_sessions'] = (int)$stmt->fetch()['total'];

        $stmt = $db->prepare(
            'SELECT COUNT(DISTINCT ss.student_id) as total
             FROM session_students ss
             JOIN sessions s ON s.id = ss.session_id
             WHERE s.teacher_id = ?'
        );
        $stmt->execute(array($user['id']));
        $stats['total_students'] = (int)$stmt->fetch()['total'];
    }

    $user['badges'] = $badges;
    $user['stats'] = $stats;

    Response::success($user);
});
