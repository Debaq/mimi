<?php
/**
 * Rutas del Modo Detective Metodologico
 *
 * Presenta protocolos de investigacion con errores intencionales
 * que el estudiante debe identificar y explicar.
 */

// GET /api/detective/cases/{sessionId} - Listar casos de una sesion
$router->get('/api/detective/cases/{sessionId}', function ($router) {
    $user = Middleware::authenticate();
    $sessionId = $router->getParam('sessionId');

    $db = Database::getInstance();

    // Verificar que la sesion existe y es modo detective
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND mode = ?');
    $stmt->execute(array($sessionId, 'detective'));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada o no es modo detective', 404);
    }

    // Obtener casos de la sesion
    $stmt = $db->prepare('SELECT * FROM detective_cases WHERE session_id = ? ORDER BY difficulty ASC, id ASC');
    $stmt->execute(array($sessionId));
    $cases = $stmt->fetchAll();

    // Procesar cada caso
    foreach ($cases as &$case) {
        $case['protocol_data'] = json_decode($case['protocol_data'], true);

        if ($user['role'] === 'estudiante') {
            // NO incluir errores para estudiantes
            unset($case['errors']);

            // Incluir el intento del estudiante si existe
            $stmt2 = $db->prepare(
                'SELECT * FROM detective_attempts WHERE case_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1'
            );
            $stmt2->execute(array($case['id'], $user['id']));
            $attempt = $stmt2->fetch();

            if ($attempt) {
                $attempt['annotations'] = json_decode($attempt['annotations'], true);
                $case['attempt'] = $attempt;
            } else {
                $case['attempt'] = null;
            }
        } else {
            // Para docentes, decodificar errores
            $case['errors'] = json_decode($case['errors'], true);
        }
    }
    unset($case);

    Response::success($cases, 'Casos obtenidos');
});

// POST /api/detective/cases - Crear caso (solo docente)
$router->post('/api/detective/cases', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $required = array('session_id', 'title', 'protocol_data', 'errors');
    foreach ($required as $field) {
        if (empty($body[$field])) {
            Response::error($field . ' es requerido', 400);
        }
    }

    $db = Database::getInstance();

    // Verificar que la sesion existe, es del docente y es modo detective
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND teacher_id = ? AND mode = ?');
    $stmt->execute(array($body['session_id'], $user['id'], 'detective'));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada, no te pertenece o no es modo detective', 404);
    }

    // Validar tipos de errores
    $validErrorTypes = array('incoherencia', 'ausencia', 'contradiccion', 'error_logico', 'sesgo');
    $errors = is_string($body['errors']) ? json_decode($body['errors'], true) : $body['errors'];

    if (!is_array($errors) || empty($errors)) {
        Response::error('Debe incluir al menos un error', 400);
    }

    foreach ($errors as $error) {
        if (empty($error['id']) || empty($error['field']) || empty($error['type'])) {
            Response::error('Cada error debe tener id, field y type', 400);
        }
        if (!in_array($error['type'], $validErrorTypes)) {
            Response::error('Tipo de error invalido: ' . $error['type'] . '. Valores validos: ' . implode(', ', $validErrorTypes), 400);
        }
    }

    $protocolData = is_string($body['protocol_data']) ? $body['protocol_data'] : json_encode($body['protocol_data']);
    $errorsJson = is_string($body['errors']) ? $body['errors'] : json_encode($body['errors']);
    $difficulty = isset($body['difficulty']) ? (int)$body['difficulty'] : 1;
    $timeLimit = isset($body['time_limit']) ? (int)$body['time_limit'] : 0;
    $description = isset($body['description']) ? $body['description'] : '';

    $stmt = $db->prepare(
        'INSERT INTO detective_cases (session_id, title, description, protocol_data, errors, difficulty, max_score, time_limit)
         VALUES (?, ?, ?, ?, ?, ?, 100, ?)'
    );
    $stmt->execute(array(
        $body['session_id'],
        $body['title'],
        $description,
        $protocolData,
        $errorsJson,
        $difficulty,
        $timeLimit
    ));

    $caseId = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM detective_cases WHERE id = ?');
    $stmt->execute(array($caseId));
    $case = $stmt->fetch();
    $case['protocol_data'] = json_decode($case['protocol_data'], true);
    $case['errors'] = json_decode($case['errors'], true);

    Response::success($case, 'Caso creado exitosamente');
});

// POST /api/detective/attempts - Iniciar intento (solo estudiante)
$router->post('/api/detective/attempts', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['case_id'])) {
        Response::error('case_id es requerido', 400);
    }

    $db = Database::getInstance();

    // Obtener el caso
    $stmt = $db->prepare('SELECT dc.*, s.id as sid FROM detective_cases dc JOIN sessions s ON s.id = dc.session_id WHERE dc.id = ?');
    $stmt->execute(array($body['case_id']));
    $case = $stmt->fetch();

    if (!$case) {
        Response::error('Caso no encontrado', 404);
    }

    // Verificar que el estudiante esta inscrito en la sesion
    $stmt = $db->prepare(
        'SELECT ss.id FROM session_students ss
         JOIN sessions s ON s.id = ss.session_id
         WHERE ss.session_id = ? AND ss.student_id = ? AND s.status = ?'
    );
    $stmt->execute(array($case['session_id'], $user['id'], 'activa'));
    if (!$stmt->fetch()) {
        Response::error('No estas inscrito en esta sesion o la sesion no esta activa', 403);
    }

    // Verificar si ya tiene un intento en progreso
    $stmt = $db->prepare(
        'SELECT * FROM detective_attempts WHERE case_id = ? AND student_id = ? AND status = ?'
    );
    $stmt->execute(array($body['case_id'], $user['id'], 'en_progreso'));
    $existing = $stmt->fetch();

    if ($existing) {
        // Retornar el intento existente
        $existing['annotations'] = json_decode($existing['annotations'], true);
        Response::success($existing, 'Intento existente en progreso');
    }

    // Calcular errores totales del caso
    $errors = json_decode($case['errors'], true);
    $errorsTotal = is_array($errors) ? count($errors) : 0;

    $stmt = $db->prepare(
        'INSERT INTO detective_attempts (case_id, student_id, annotations, errors_total, status)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $body['case_id'],
        $user['id'],
        '[]',
        $errorsTotal,
        'en_progreso'
    ));

    $attemptId = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM detective_attempts WHERE id = ?');
    $stmt->execute(array($attemptId));
    $attempt = $stmt->fetch();
    $attempt['annotations'] = json_decode($attempt['annotations'], true);

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'detective_started',
        0,
        json_encode(array('case_id' => (int)$body['case_id'], 'attempt_id' => (int)$attemptId))
    ));

    Response::success($attempt, 'Intento iniciado');
});

// PUT /api/detective/attempts/{id} - Actualizar anotaciones (solo estudiante)
$router->put('/api/detective/attempts/{id}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $attemptId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    // Obtener el intento
    $stmt = $db->prepare('SELECT * FROM detective_attempts WHERE id = ? AND student_id = ?');
    $stmt->execute(array($attemptId, $user['id']));
    $attempt = $stmt->fetch();

    if (!$attempt) {
        Response::error('Intento no encontrado', 404);
    }

    if ($attempt['status'] !== 'en_progreso') {
        Response::error('Este intento ya fue completado', 400);
    }

    // Actualizar anotaciones
    if (array_key_exists('annotations', $body)) {
        $annotations = is_string($body['annotations']) ? $body['annotations'] : json_encode($body['annotations']);
        $stmt = $db->prepare('UPDATE detective_attempts SET annotations = ? WHERE id = ?');
        $stmt->execute(array($annotations, $attemptId));
    }

    // Actualizar tiempo
    if (array_key_exists('time_spent', $body)) {
        $stmt = $db->prepare('UPDATE detective_attempts SET time_spent = ? WHERE id = ?');
        $stmt->execute(array((int)$body['time_spent'], $attemptId));
    }

    // Obtener intento actualizado
    $stmt = $db->prepare('SELECT * FROM detective_attempts WHERE id = ?');
    $stmt->execute(array($attemptId));
    $updated = $stmt->fetch();
    $updated['annotations'] = json_decode($updated['annotations'], true);

    Response::success($updated, 'Anotaciones actualizadas');
});

// POST /api/detective/attempts/{id}/submit - Enviar intento para evaluacion
$router->post('/api/detective/attempts/{id}/submit', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $attemptId = $router->getParam('id');

    $db = Database::getInstance();

    // Obtener el intento
    $stmt = $db->prepare('SELECT * FROM detective_attempts WHERE id = ? AND student_id = ?');
    $stmt->execute(array($attemptId, $user['id']));
    $attempt = $stmt->fetch();

    if (!$attempt) {
        Response::error('Intento no encontrado', 404);
    }

    if ($attempt['status'] !== 'en_progreso') {
        Response::error('Este intento ya fue completado', 400);
    }

    // Obtener el caso con sus errores
    $stmt = $db->prepare('SELECT * FROM detective_cases WHERE id = ?');
    $stmt->execute(array($attempt['case_id']));
    $case = $stmt->fetch();

    if (!$case) {
        Response::error('Caso no encontrado', 404);
    }

    $caseErrors = json_decode($case['errors'], true);
    $studentAnnotations = json_decode($attempt['annotations'], true);

    if (!is_array($studentAnnotations)) {
        $studentAnnotations = array();
    }

    // Comparar anotaciones del estudiante con errores reales
    $errorsFound = 0;
    $explanationQuality = 0;
    $totalErrors = count($caseErrors);
    $matchedErrors = array();

    foreach ($caseErrors as $caseError) {
        foreach ($studentAnnotations as $annotation) {
            if (isset($annotation['error_id']) && $annotation['error_id'] === $caseError['id']) {
                $errorsFound++;
                $matchedErrors[] = $caseError['id'];

                // Evaluar calidad de la explicacion: mas de 20 palabras = buena
                if (isset($annotation['explanation'])) {
                    $wordCount = str_word_count($annotation['explanation']);
                    if ($wordCount > 20) {
                        $explanationQuality++;
                    }
                }
                break;
            }
        }
    }

    // Calcular score
    // (errores_encontrados / errores_totales * 70) + (calidad_explicaciones * 30)
    $detectionScore = $totalErrors > 0 ? ($errorsFound / $totalErrors) * 70 : 0;
    $qualityScore = $errorsFound > 0 ? ($explanationQuality / $errorsFound) * 30 : 0;
    $score = (int)round($detectionScore + $qualityScore);

    // Reducir score por pistas usadas (5 puntos por pista)
    $hintsReduction = (int)$attempt['hints_used'] * 5;
    $score = max(0, $score - $hintsReduction);

    // Actualizar intento
    $stmt = $db->prepare(
        'UPDATE detective_attempts SET score = ?, errors_found = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    $stmt->execute(array($score, $errorsFound, 'completado', $attemptId));

    // Otorgar XP segun score
    $xpEarned = 0;
    if ($score >= 100) {
        $xpEarned = 150;
    } elseif ($score >= 80) {
        $xpEarned = 100;
    } elseif ($score >= 60) {
        $xpEarned = 50;
    } else {
        $xpEarned = 10;
    }

    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    // Registrar en activity_log
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'detective_completed',
        $xpEarned,
        json_encode(array(
            'case_id' => (int)$attempt['case_id'],
            'attempt_id' => (int)$attemptId,
            'score' => $score,
            'errors_found' => $errorsFound,
            'errors_total' => $totalErrors
        ))
    ));

    // Verificar subida de nivel
    checkLevelUp($db, $user['id']);

    // Preparar resultados detallados
    $results = array();
    foreach ($caseErrors as $caseError) {
        $found = in_array($caseError['id'], $matchedErrors);
        $studentExplanation = null;

        if ($found) {
            foreach ($studentAnnotations as $annotation) {
                if (isset($annotation['error_id']) && $annotation['error_id'] === $caseError['id']) {
                    $studentExplanation = isset($annotation['explanation']) ? $annotation['explanation'] : '';
                    break;
                }
            }
        }

        $results[] = array(
            'error_id' => $caseError['id'],
            'field' => $caseError['field'],
            'type' => $caseError['type'],
            'description' => $caseError['description'],
            'found' => $found,
            'student_explanation' => $studentExplanation,
            'severity' => isset($caseError['severity']) ? $caseError['severity'] : 'media'
        );
    }

    Response::success(array(
        'score' => $score,
        'errors_found' => $errorsFound,
        'errors_total' => $totalErrors,
        'xp_earned' => $xpEarned,
        'results' => $results
    ), 'Intento evaluado');
});

// GET /api/detective/attempts/{id}/hint - Obtener pista
$router->get('/api/detective/attempts/{id}/hint', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $attemptId = $router->getParam('id');

    $db = Database::getInstance();

    // Obtener el intento
    $stmt = $db->prepare('SELECT * FROM detective_attempts WHERE id = ? AND student_id = ?');
    $stmt->execute(array($attemptId, $user['id']));
    $attempt = $stmt->fetch();

    if (!$attempt) {
        Response::error('Intento no encontrado', 404);
    }

    if ($attempt['status'] !== 'en_progreso') {
        Response::error('Este intento ya fue completado', 400);
    }

    // Verificar que la sesion tiene show_hints habilitado
    $stmt = $db->prepare(
        'SELECT s.show_hints FROM sessions s
         JOIN detective_cases dc ON dc.session_id = s.id
         WHERE dc.id = ?'
    );
    $stmt->execute(array($attempt['case_id']));
    $session = $stmt->fetch();

    if (!$session || !$session['show_hints']) {
        Response::error('Las pistas no estan habilitadas en esta sesion', 403);
    }

    // Obtener el caso con sus errores
    $stmt = $db->prepare('SELECT * FROM detective_cases WHERE id = ?');
    $stmt->execute(array($attempt['case_id']));
    $case = $stmt->fetch();

    $caseErrors = json_decode($case['errors'], true);
    $studentAnnotations = json_decode($attempt['annotations'], true);

    if (!is_array($studentAnnotations)) {
        $studentAnnotations = array();
    }

    // Encontrar errores que el estudiante aun no ha marcado
    $foundErrorIds = array();
    foreach ($studentAnnotations as $annotation) {
        if (isset($annotation['error_id'])) {
            $foundErrorIds[] = $annotation['error_id'];
        }
    }

    $nextHint = null;
    foreach ($caseErrors as $error) {
        if (!in_array($error['id'], $foundErrorIds)) {
            $nextHint = array(
                'field' => $error['field'],
                'hint' => isset($error['hint']) ? $error['hint'] : 'Revisa cuidadosamente la seccion: ' . $error['field'],
                'severity' => isset($error['severity']) ? $error['severity'] : 'media'
            );
            break;
        }
    }

    if (!$nextHint) {
        Response::success(array('hint' => null), 'Ya encontraste todos los errores');
    }

    // Incrementar pistas usadas
    $stmt = $db->prepare('UPDATE detective_attempts SET hints_used = hints_used + 1 WHERE id = ?');
    $stmt->execute(array($attemptId));

    $hintsUsed = (int)$attempt['hints_used'] + 1;
    $maxScoreReduction = $hintsUsed * 5;

    Response::success(array(
        'hint' => $nextHint,
        'hints_used' => $hintsUsed,
        'score_penalty' => $maxScoreReduction
    ), 'Pista obtenida (-5 puntos al score maximo)');
});
