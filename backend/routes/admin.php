<?php
/**
 * Rutas de administracion - CRUD de usuarios
 * Todos los endpoints requieren rol 'admin'
 */

// GET /api/admin/stats - Estadisticas globales del sistema
$router->get('/api/admin/stats', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

    $db = Database::getInstance();

    // Total usuarios por rol
    $stmt = $db->query("SELECT role, COUNT(*) as total FROM users GROUP BY role");
    $byRole = array('estudiante' => 0, 'docente' => 0, 'admin' => 0);
    while ($row = $stmt->fetch()) {
        $byRole[$row['role']] = (int)$row['total'];
    }

    $totalUsers = array_sum($byRole);

    // Total sesiones
    $totalSessions = (int)$db->query("SELECT COUNT(*) as total FROM sessions")->fetch()['total'];

    // Sesiones activas
    $activeSessions = (int)$db->query("SELECT COUNT(*) as total FROM sessions WHERE status = 'activa'")->fetch()['total'];

    // Total protocolos
    $totalProtocols = (int)$db->query("SELECT COUNT(*) as total FROM protocols")->fetch()['total'];

    // Ultimos 5 usuarios registrados
    $stmt = $db->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    $recentUsers = $stmt->fetchAll();

    Response::success(array(
        'total_users' => $totalUsers,
        'users_by_role' => $byRole,
        'total_sessions' => $totalSessions,
        'active_sessions' => $activeSessions,
        'total_protocols' => $totalProtocols,
        'recent_users' => $recentUsers,
    ));
});

// GET /api/admin/users - Listar usuarios con paginacion, filtro y busqueda
$router->get('/api/admin/users', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

    $db = Database::getInstance();

    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;
    $role = isset($_GET['role']) ? $_GET['role'] : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $where = array();
    $params = array();

    if ($role && in_array($role, array('estudiante', 'docente', 'admin'))) {
        $where[] = 'role = ?';
        $params[] = $role;
    }

    if ($search !== '') {
        $where[] = '(name LIKE ? OR email LIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    // Total count
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM users $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['total'];

    // Fetch users
    $sql = "SELECT id, name, email, role, level, xp, avatar_url, created_at FROM users $whereSql ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $queryParams = array_merge($params, array($limit, $offset));
    $stmt = $db->prepare($sql);
    $stmt->execute($queryParams);
    $users = $stmt->fetchAll();

    Response::success(array(
        'users' => $users,
        'pagination' => array(
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => (int)ceil($total / $limit),
        ),
    ));
});

// GET /api/admin/users/{id} - Obtener un usuario
$router->get('/api/admin/users/(\d+)', function ($router, $id) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute(array($id));
    $target = $stmt->fetch();

    if (!$target) {
        Response::error('Usuario no encontrado', 404);
    }

    Response::success($target);
});

// POST /api/admin/users - Crear usuario
$router->post('/api/admin/users', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

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
    if (empty($body['role'])) {
        $errors[] = 'El rol es requerido';
    } elseif (!in_array($body['role'], array('estudiante', 'docente', 'admin'))) {
        $errors[] = 'El rol debe ser estudiante, docente o admin';
    }

    if (!empty($errors)) {
        Response::error('Datos invalidos', 400, $errors);
    }

    $db = Database::getInstance();

    // Verificar email duplicado
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(array(strtolower(trim($body['email']))));
    if ($stmt->fetch()) {
        Response::error('El email ya esta registrado', 409);
    }

    // Password: usar la proporcionada o generar temporal
    $tempPassword = null;
    if (!empty($body['password']) && strlen($body['password']) >= 6) {
        $passwordHash = password_hash($body['password'], PASSWORD_BCRYPT);
    } else {
        $tempPassword = bin2hex(random_bytes(4));
        $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);
    }

    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        trim($body['name']),
        strtolower(trim($body['email'])),
        $passwordHash,
        $body['role'],
    ));

    $newId = $db->lastInsertId();

    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute(array($newId));
    $newUser = $stmt->fetch();

    $response = array('user' => $newUser);
    if ($tempPassword !== null) {
        $response['temp_password'] = $tempPassword;
    }

    Response::success($response, 'Usuario creado exitosamente');
});

// PUT /api/admin/users/{id} - Editar usuario
$router->put('/api/admin/users/(\d+)', function ($router, $id) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    // Verificar que el usuario existe
    $stmt = $db->prepare('SELECT id, role, email FROM users WHERE id = ?');
    $stmt->execute(array($id));
    $target = $stmt->fetch();

    if (!$target) {
        Response::error('Usuario no encontrado', 404);
    }

    // Admin no puede degradarse a si mismo
    if ((int)$id === (int)$user['id'] && !empty($body['role']) && $body['role'] !== 'admin') {
        Response::error('No puedes cambiar tu propio rol de administrador', 403);
    }

    // Construir actualizacion
    $fields = array();
    $params = array();

    if (!empty($body['name'])) {
        $fields[] = 'name = ?';
        $params[] = trim($body['name']);
    }

    if (!empty($body['email'])) {
        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('El email no es valido', 400);
        }
        // Verificar duplicado (excluyendo el usuario actual)
        $checkStmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $checkStmt->execute(array(strtolower(trim($body['email'])), $id));
        if ($checkStmt->fetch()) {
            Response::error('El email ya esta registrado por otro usuario', 409);
        }
        $fields[] = 'email = ?';
        $params[] = strtolower(trim($body['email']));
    }

    if (!empty($body['role'])) {
        if (!in_array($body['role'], array('estudiante', 'docente', 'admin'))) {
            Response::error('Rol invalido', 400);
        }
        $fields[] = 'role = ?';
        $params[] = $body['role'];
    }

    if (!empty($body['password'])) {
        if (strlen($body['password']) < 6) {
            Response::error('La contrasena debe tener al menos 6 caracteres', 400);
        }
        $fields[] = 'password_hash = ?';
        $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
    }

    if (empty($fields)) {
        Response::error('No se proporcionaron campos para actualizar', 400);
    }

    $fields[] = 'updated_at = CURRENT_TIMESTAMP';
    $params[] = $id;

    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Retornar usuario actualizado
    $stmt = $db->prepare('SELECT id, name, email, role, level, xp, avatar_url, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute(array($id));
    $updated = $stmt->fetch();

    Response::success(array('user' => $updated), 'Usuario actualizado exitosamente');
});

// DELETE /api/admin/users/{id} - Eliminar usuario
$router->delete('/api/admin/users/(\d+)', function ($router, $id) {
    $user = Middleware::authenticate();
    Middleware::requireRole('admin', $user);

    // Admin no puede eliminarse a si mismo
    if ((int)$id === (int)$user['id']) {
        Response::error('No puedes eliminar tu propia cuenta de administrador', 403);
    }

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT id, name, email FROM users WHERE id = ?');
    $stmt->execute(array($id));
    $target = $stmt->fetch();

    if (!$target) {
        Response::error('Usuario no encontrado', 404);
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute(array($id));

    Response::success(null, 'Usuario eliminado exitosamente');
});
