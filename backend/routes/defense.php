<?php
/**
 * Rutas del simulador de defensa de tesis
 */

// POST /api/defense/start - Iniciar sesion de defensa
$router->post('/api/defense/start', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['protocol_id'])) {
        Response::error('protocol_id es requerido', 400);
    }

    $protocolId = (int)$body['protocol_id'];
    $db = Database::getInstance();

    // Obtener el protocolo
    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ? AND student_id = ?');
    $stmt->execute(array($protocolId, $user['id']));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    // Verificar status del protocolo
    if (!in_array($protocol['status'], array('enviado', 'aprobado'))) {
        Response::error('El protocolo debe estar enviado o aprobado para iniciar una defensa', 400);
    }

    // Verificar si ya hay una defensa en curso
    $stmt = $db->prepare(
        'SELECT id FROM defense_sessions WHERE protocol_id = ? AND student_id = ? AND status = ?'
    );
    $stmt->execute(array($protocolId, $user['id'], 'en_curso'));
    $activeDefense = $stmt->fetch();

    if ($activeDefense) {
        // Devolver la defensa activa existente
        $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ?');
        $stmt->execute(array($activeDefense['id']));
        $session = $stmt->fetch();

        $session['questions'] = json_decode($session['questions'], true);
        $session['answers'] = json_decode($session['answers'], true);
        $session['scores'] = json_decode($session['scores'], true);

        // Remover criterios y keywords de las preguntas para el estudiante
        $cleanQuestions = array();
        foreach ($session['questions'] as $q) {
            $cleanQuestions[] = array(
                'category' => $q['category'],
                'text' => $q['text'],
                'context' => isset($q['context']) ? $q['context'] : ''
            );
        }
        $session['questions'] = $cleanQuestions;

        Response::success($session, 'Ya tienes una defensa en curso');
    }

    // Decodificar campos JSON del protocolo
    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    // Generar preguntas
    $generator = new DefenseQuestionGenerator();
    $questions = $generator->generateQuestions($protocol, 5);

    // Crear sesion de defensa
    $stmt = $db->prepare(
        'INSERT INTO defense_sessions (protocol_id, student_id, questions, answers, scores, status, time_limit, started_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    );
    $stmt->execute(array(
        $protocolId,
        $user['id'],
        json_encode($questions),
        json_encode(array('', '', '', '', '')),
        json_encode(array(0, 0, 0, 0, 0)),
        'en_curso',
        30
    ));

    $sessionId = $db->lastInsertId();

    // Obtener la sesion creada
    $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ?');
    $stmt->execute(array($sessionId));
    $session = $stmt->fetch();

    $session['questions'] = json_decode($session['questions'], true);
    $session['answers'] = json_decode($session['answers'], true);
    $session['scores'] = json_decode($session['scores'], true);

    // Remover criterios y keywords de las preguntas para el estudiante
    $cleanQuestions = array();
    foreach ($session['questions'] as $q) {
        $cleanQuestions[] = array(
            'category' => $q['category'],
            'text' => $q['text'],
            'context' => isset($q['context']) ? $q['context'] : ''
        );
    }
    $session['questions'] = $cleanQuestions;

    Response::success($session, 'Defensa iniciada exitosamente');
});

// POST /api/defense/{id}/answer - Responder una pregunta de la defensa
$router->post('/api/defense/{id}/answer', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $sessionId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    if (!isset($body['question_index']) || !isset($body['answer'])) {
        Response::error('question_index y answer son requeridos', 400);
    }

    $questionIndex = (int)$body['question_index'];
    $answer = trim($body['answer']);

    if ($questionIndex < 0 || $questionIndex > 4) {
        Response::error('question_index debe estar entre 0 y 4', 400);
    }

    if (empty($answer)) {
        Response::error('La respuesta no puede estar vacia', 400);
    }

    $db = Database::getInstance();

    // Obtener la sesion de defensa
    $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ? AND student_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion de defensa no encontrada', 404);
    }

    if ($session['status'] !== 'en_curso') {
        Response::error('Esta sesion de defensa ya no esta en curso', 400);
    }

    // Decodificar datos
    $questions = json_decode($session['questions'], true);
    $answers = json_decode($session['answers'], true);
    $scores = json_decode($session['scores'], true);

    // Obtener el protocolo para la evaluacion
    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($session['protocol_id']));
    $protocol = $stmt->fetch();

    $protocol['specific_objectives'] = json_decode($protocol['specific_objectives'], true);
    $protocol['variables'] = json_decode($protocol['variables'], true);
    $protocol['research_design'] = json_decode($protocol['research_design'], true);
    $protocol['sample'] = json_decode($protocol['sample'], true);
    $protocol['instruments'] = json_decode($protocol['instruments'], true);

    // Evaluar la respuesta
    $generator = new DefenseQuestionGenerator();
    $score = $generator->evaluateAnswer($questions[$questionIndex], $answer, $protocol);

    // Actualizar respuestas y scores
    $answers[$questionIndex] = $answer;
    $scores[$questionIndex] = $score;

    $stmt = $db->prepare('UPDATE defense_sessions SET answers = ?, scores = ? WHERE id = ?');
    $stmt->execute(array(
        json_encode($answers),
        json_encode($scores),
        $sessionId
    ));

    Response::success(array(
        'question_index' => $questionIndex,
        'score' => $score,
        'answers' => $answers,
        'scores' => $scores
    ), 'Respuesta registrada');
});

// POST /api/defense/{id}/finish - Finalizar sesion de defensa
$router->post('/api/defense/{id}/finish', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $sessionId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    // Obtener la sesion de defensa
    $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ? AND student_id = ?');
    $stmt->execute(array($sessionId, $user['id']));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion de defensa no encontrada', 404);
    }

    if ($session['status'] !== 'en_curso') {
        Response::error('Esta sesion de defensa ya no esta en curso', 400);
    }

    $scores = json_decode($session['scores'], true);

    // Calcular score general (promedio)
    $validScores = array_filter($scores, function ($s) {
        return $s > 0;
    });
    $overallScore = count($validScores) > 0
        ? (int)round(array_sum($validScores) / count($validScores))
        : 0;

    // Calcular tiempo invertido
    $timeSpent = isset($body['time_spent']) ? (int)$body['time_spent'] : 0;
    if ($timeSpent <= 0 && !empty($session['started_at'])) {
        $startedAt = strtotime($session['started_at']);
        $timeSpent = time() - $startedAt;
    }

    // Actualizar sesion
    $stmt = $db->prepare(
        'UPDATE defense_sessions SET status = ?, overall_score = ?, time_spent = ?, completed_at = datetime("now") WHERE id = ?'
    );
    $stmt->execute(array('completada', $overallScore, $timeSpent, $sessionId));

    // Calcular XP segun score
    if ($overallScore >= 90) {
        $xpEarned = 200;
    } elseif ($overallScore >= 70) {
        $xpEarned = 150;
    } elseif ($overallScore >= 50) {
        $xpEarned = 100;
    } else {
        $xpEarned = 25;
    }

    // Dar XP al estudiante
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    // Registrar en activity_log
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'defense_completed',
        $xpEarned,
        json_encode(array(
            'defense_session_id' => (int)$sessionId,
            'protocol_id' => (int)$session['protocol_id'],
            'overall_score' => $overallScore,
            'scores' => $scores
        ))
    ));

    // Verificar subida de nivel
    checkLevelUp($db, $user['id']);

    // Obtener sesion actualizada
    $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ?');
    $stmt->execute(array($sessionId));
    $updated = $stmt->fetch();

    $updated['questions'] = json_decode($updated['questions'], true);
    $updated['answers'] = json_decode($updated['answers'], true);
    $updated['scores'] = json_decode($updated['scores'], true);

    // Limpiar preguntas (sin criterios internos)
    $cleanQuestions = array();
    foreach ($updated['questions'] as $q) {
        $cleanQuestions[] = array(
            'category' => $q['category'],
            'text' => $q['text'],
            'context' => isset($q['context']) ? $q['context'] : ''
        );
    }
    $updated['questions'] = $cleanQuestions;

    Response::success(array(
        'session' => $updated,
        'xp_earned' => $xpEarned
    ), 'Defensa completada');
});

// GET /api/defense/{id} - Ver resultado de una defensa
$router->get('/api/defense/{id}', function ($router) {
    $user = Middleware::authenticate();
    $sessionId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM defense_sessions WHERE id = ?');
    $stmt->execute(array($sessionId));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion de defensa no encontrada', 404);
    }

    // Verificar acceso
    if ($user['role'] === 'estudiante' && $session['student_id'] != $user['id']) {
        Response::error('No tienes acceso a esta sesion de defensa', 403);
    }

    if ($user['role'] === 'docente') {
        // Verificar que el protocolo pertenece a una sesion del docente
        $stmt = $db->prepare(
            'SELECT p.id FROM protocols p
             JOIN sessions s ON s.id = p.session_id
             WHERE p.id = ? AND s.teacher_id = ?'
        );
        $stmt->execute(array($session['protocol_id'], $user['id']));
        if (!$stmt->fetch()) {
            Response::error('No tienes acceso a esta sesion de defensa', 403);
        }
    }

    $session['questions'] = json_decode($session['questions'], true);
    $session['answers'] = json_decode($session['answers'], true);
    $session['scores'] = json_decode($session['scores'], true);

    // Limpiar preguntas (sin criterios internos)
    $cleanQuestions = array();
    if (is_array($session['questions'])) {
        foreach ($session['questions'] as $q) {
            $cleanQuestions[] = array(
                'category' => $q['category'],
                'text' => $q['text'],
                'context' => isset($q['context']) ? $q['context'] : ''
            );
        }
    }
    $session['questions'] = $cleanQuestions;

    Response::success($session);
});

// GET /api/defense/protocol/{protocolId} - Ver defensas de un protocolo
$router->get('/api/defense/protocol/{protocolId}', function ($router) {
    $user = Middleware::authenticate();
    $protocolId = $router->getParam('protocolId');

    $db = Database::getInstance();

    // Verificar acceso al protocolo
    $stmt = $db->prepare('SELECT * FROM protocols WHERE id = ?');
    $stmt->execute(array($protocolId));
    $protocol = $stmt->fetch();

    if (!$protocol) {
        Response::error('Protocolo no encontrado', 404);
    }

    if ($user['role'] === 'estudiante' && $protocol['student_id'] != $user['id']) {
        Response::error('No tienes acceso a este protocolo', 403);
    }

    if ($user['role'] === 'docente') {
        $stmt = $db->prepare('SELECT teacher_id FROM sessions WHERE id = ?');
        $stmt->execute(array($protocol['session_id']));
        $sessionData = $stmt->fetch();
        if ($sessionData['teacher_id'] != $user['id']) {
            Response::error('No tienes acceso a este protocolo', 403);
        }
    }

    // Obtener todas las defensas del protocolo
    $stmt = $db->prepare(
        'SELECT * FROM defense_sessions WHERE protocol_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute(array($protocolId));
    $sessions = $stmt->fetchAll();

    // Decodificar JSON de cada sesion
    foreach ($sessions as &$s) {
        $s['questions'] = json_decode($s['questions'], true);
        $s['answers'] = json_decode($s['answers'], true);
        $s['scores'] = json_decode($s['scores'], true);

        // Limpiar preguntas
        $cleanQuestions = array();
        if (is_array($s['questions'])) {
            foreach ($s['questions'] as $q) {
                $cleanQuestions[] = array(
                    'category' => $q['category'],
                    'text' => $q['text'],
                    'context' => isset($q['context']) ? $q['context'] : ''
                );
            }
        }
        $s['questions'] = $cleanQuestions;
    }

    Response::success($sessions);
});
