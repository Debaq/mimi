<?php
/**
 * Rutas de autenticacion
 */

// POST /api/auth/register - Registrar nuevo usuario
$router->post('/api/auth/register', function ($router) {
    Middleware::rateLimit('register', 30, 60);

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
    Middleware::rateLimit('login', 30, 5);

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
    } elseif ($user['role'] === 'admin') {
        $stats['total_users'] = (int)$db->query("SELECT COUNT(*) as total FROM users")->fetch()['total'];
        $stats['total_sessions'] = (int)$db->query("SELECT COUNT(*) as total FROM sessions")->fetch()['total'];
        $stats['total_protocols'] = (int)$db->query("SELECT COUNT(*) as total FROM protocols")->fetch()['total'];
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

// POST /api/auth/forgot-password - Solicitar reset de contrasena
$router->post('/api/auth/forgot-password', function ($router) {
    Middleware::rateLimit('forgot_password', 10, 15);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar email
    if (empty($body['email'])) {
        Response::error('El email es requerido', 400);
    }
    if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
        Response::error('El email no es valido', 400);
    }

    $genericMessage = 'Si ese correo esta registrado, recibiras instrucciones para restablecer tu contrasena.';

    $db = Database::getInstance();
    $email = strtolower(trim($body['email']));

    // Buscar usuario
    $stmt = $db->prepare('SELECT id, name, email FROM users WHERE email = ?');
    $stmt->execute(array($email));
    $user = $stmt->fetch();

    if (!$user) {
        // No revelar si el email existe
        Response::success(null, $genericMessage);
    }

    // Generar token seguro
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Guardar token en DB
    $stmt = $db->prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?');
    $stmt->execute(array($token, $expires, $user['id']));

    // En modo DEBUG retornar el token directamente
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        Response::success(array('debug_token' => $token), $genericMessage);
    }

    // Enviar email con mail()
    // Detectar URL del frontend: variable de entorno, o auto-detectar del header Referer/Origin
    $frontendUrl = getenv('FRONTEND_URL');
    if (!$frontendUrl) {
        $frontendUrl = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    }
    if (!$frontendUrl && isset($_SERVER['HTTP_REFERER'])) {
        $parsed = parse_url($_SERVER['HTTP_REFERER']);
        $frontendUrl = $parsed['scheme'] . '://' . $parsed['host'];
        if (isset($parsed['port'])) {
            $frontendUrl .= ':' . $parsed['port'];
        }
    }
    if (!$frontendUrl) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $frontendUrl = $scheme . '://' . $_SERVER['HTTP_HOST'];
    }
    $resetLink = $frontendUrl . '/reset-password?token=' . $token;

    $to = $user['email'];
    $subject = 'MIMI - Restablecer contrasena';
    $body = "Hola " . $user['name'] . ",\r\n\r\n"
          . "Recibimos una solicitud para restablecer tu contrasena en MIMI.\r\n\r\n"
          . "Haz clic en el siguiente enlace para crear una nueva contrasena:\r\n"
          . $resetLink . "\r\n\r\n"
          . "Este enlace expira en 1 hora.\r\n\r\n"
          . "Si no solicitaste este cambio, puedes ignorar este correo.\r\n\r\n"
          . "- El equipo de MIMI";
    $headers = "From: noreply@mimi.edu\r\nContent-Type: text/plain; charset=UTF-8";

    @mail($to, $subject, $body, $headers);

    Response::success(null, $genericMessage);
});

// POST /api/auth/reset-password - Restablecer contrasena con token
$router->post('/api/auth/reset-password', function ($router) {
    Middleware::rateLimit('reset_password', 5, 15);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos
    if (empty($body['token'])) {
        Response::error('El token es requerido', 400);
    }
    if (empty($body['password'])) {
        Response::error('La contrasena es requerida', 400);
    }
    if (strlen($body['password']) < 6) {
        Response::error('La contrasena debe tener al menos 6 caracteres', 400);
    }

    $db = Database::getInstance();

    // Buscar usuario con token valido y no expirado
    $stmt = $db->prepare(
        'SELECT id, name, email FROM users WHERE password_reset_token = ? AND password_reset_expires > ?'
    );
    $stmt->execute(array($body['token'], date('Y-m-d H:i:s')));
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('Token invalido o expirado', 400);
    }

    // Actualizar contrasena y limpiar token
    $passwordHash = Auth::hashPassword($body['password']);
    $stmt = $db->prepare(
        'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?'
    );
    $stmt->execute(array($passwordHash, $user['id']));

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'password_reset',
        0,
        json_encode(array('timestamp' => date('Y-m-d H:i:s')))
    ));

    Response::success(null, 'Contrasena actualizada exitosamente');
});

// POST /api/auth/avatar - Subir avatar del usuario [AUTH]
$router->post('/api/auth/avatar', function ($router) {
    $user = Middleware::authenticate();

    // Verificar que se envio un archivo
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] === UPLOAD_ERR_NO_FILE) {
        Response::error('No se envio ningun archivo', 400);
    }

    $file = $_FILES['avatar'];

    // Verificar errores de subida
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = array(
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamano maximo permitido por el servidor',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamano maximo permitido por el formulario',
            UPLOAD_ERR_PARTIAL => 'El archivo se subio parcialmente',
            UPLOAD_ERR_NO_TMP_DIR => 'No se encontro el directorio temporal',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en disco',
            UPLOAD_ERR_EXTENSION => 'Una extension de PHP detuvo la subida',
        );
        $errorMsg = isset($uploadErrors[$file['error']])
            ? $uploadErrors[$file['error']]
            : 'Error desconocido al subir el archivo';
        Response::error($errorMsg, 400);
    }

    // Validar tamano maximo: 2MB
    $maxSize = 2 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        Response::error('El archivo excede el tamano maximo de 2MB', 400);
    }

    // Validar tipo MIME (debe ser imagen)
    $allowedMimes = array(
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    );

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!isset($allowedMimes[$mimeType])) {
        Response::error('Tipo de archivo no permitido. Solo se aceptan: JPEG, PNG, GIF, WebP', 400);
    }

    $extension = $allowedMimes[$mimeType];

    // Generar nombre unico
    $filename = 'avatar_' . $user['id'] . '_' . time() . '.' . $extension;
    $uploadDir = APP_ROOT . '/uploads/avatars/';
    $destPath = $uploadDir . $filename;

    // Crear directorio si no existe
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Eliminar avatar anterior si existe
    $db = Database::getInstance();
    if (!empty($user['avatar_url'])) {
        $oldFilePath = APP_ROOT . $user['avatar_url'];
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
    }

    // Mover archivo subido al destino
    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        Response::error('Error al guardar el archivo', 500);
    }

    // Actualizar avatar_url en la base de datos
    $avatarUrl = '/uploads/avatars/' . $filename;
    $stmt = $db->prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
    $stmt->execute(array($avatarUrl, $user['id']));

    // Obtener usuario actualizado
    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute(array($user['id']));
    $updatedUser = $stmt->fetch();

    Response::success(array(
        'user' => $updatedUser
    ), 'Avatar actualizado exitosamente');
});
