<?php
/**
 * Rutas de recursos educativos
 */

// GET /api/resources - Listar recursos con filtros
$router->get('/api/resources', function ($router) {
    $user = Middleware::optionalAuth();
    $request = $router->getRequest();

    $db = Database::getInstance();

    $conditions = array();
    $params = array();

    // Filtro por tipo
    $type = $request->query('type');
    if ($type !== null && in_array($type, array('video', 'referencia', 'plantilla', 'glosario'))) {
        $conditions[] = 'type = ?';
        $params[] = $type;
    }

    // Filtro por categoria
    $category = $request->query('category');
    if ($category !== null && in_array($category, array('conceptual', 'procedimental', 'caso_resuelto'))) {
        $conditions[] = 'category = ?';
        $params[] = $category;
    }

    // Filtro por nivel minimo
    if ($user !== null) {
        $conditions[] = 'min_level <= ?';
        $params[] = $user['level'];
    }

    // Filtro por busqueda en titulo o keywords
    $search = $request->query('search');
    if ($search !== null && strlen(trim($search)) > 0) {
        $conditions[] = '(title LIKE ? OR keywords LIKE ?)';
        $searchTerm = '%' . trim($search) . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $whereClause = '';
    if (!empty($conditions)) {
        $whereClause = 'WHERE ' . implode(' AND ', $conditions);
    }

    $sql = 'SELECT * FROM resources ' . $whereClause . ' ORDER BY created_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $resources = $stmt->fetchAll();

    Response::success($resources);
});

// GET /api/resources/{id} - Detalle de recurso
$router->get('/api/resources/{id}', function ($router) {
    $resourceId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM resources WHERE id = ?');
    $stmt->execute(array($resourceId));
    $resource = $stmt->fetch();

    if (!$resource) {
        Response::error('Recurso no encontrado', 404);
    }

    Response::success($resource);
});

// POST /api/resources - Crear recurso (solo docente)
$router->post('/api/resources', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $errors = array();
    if (empty($body['title'])) {
        $errors[] = 'El titulo es requerido';
    }
    if (empty($body['type']) || !in_array($body['type'], array('video', 'referencia', 'plantilla', 'glosario'))) {
        $errors[] = 'El tipo debe ser: video, referencia, plantilla o glosario';
    }
    if (empty($body['content'])) {
        $errors[] = 'El contenido es requerido';
    }

    if (!empty($errors)) {
        Response::error('Datos invalidos', 400, $errors);
    }

    $category = isset($body['category']) ? $body['category'] : 'conceptual';
    if (!in_array($category, array('conceptual', 'procedimental', 'caso_resuelto'))) {
        $category = 'conceptual';
    }

    $db = Database::getInstance();
    $stmt = $db->prepare(
        'INSERT INTO resources (title, type, content, category, keywords, min_level) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute(array(
        trim($body['title']),
        $body['type'],
        $body['content'],
        $category,
        isset($body['keywords']) ? $body['keywords'] : null,
        isset($body['min_level']) ? (int)$body['min_level'] : 1
    ));

    $resourceId = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM resources WHERE id = ?');
    $stmt->execute(array($resourceId));
    $resource = $stmt->fetch();

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'crear_recurso',
        json_encode(array('resource_id' => $resourceId, 'title' => $body['title']))
    ));

    Response::success($resource, 'Recurso creado exitosamente');
});
