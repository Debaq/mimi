<?php
/**
 * Rutas del Modo Laboratorio Estadistico
 *
 * Motor de calculo estadistico y endpoints para experimentos/intentos.
 */

// =============================================
// Motor de calculo estadistico
// =============================================

/**
 * Calcula la media (promedio) de un array de valores numericos
 *
 * @param array $data
 * @return float
 */
function stat_media($data)
{
    $data = array_filter($data, 'is_numeric');
    $data = array_values($data);
    if (empty($data)) {
        return 0;
    }
    return array_sum($data) / count($data);
}

/**
 * Calcula la mediana de un array de valores numericos
 *
 * @param array $data
 * @return float
 */
function stat_mediana($data)
{
    $data = array_filter($data, 'is_numeric');
    $data = array_values($data);
    if (empty($data)) {
        return 0;
    }
    sort($data);
    $count = count($data);
    $mid = (int)floor($count / 2);
    if ($count % 2 === 0) {
        return ($data[$mid - 1] + $data[$mid]) / 2;
    }
    return $data[$mid];
}

/**
 * Calcula la moda de un array de valores
 *
 * @param array $data
 * @return mixed Valor mas frecuente (o array si hay empate)
 */
function stat_moda($data)
{
    $data = array_filter($data, 'is_numeric');
    $data = array_values($data);
    if (empty($data)) {
        return null;
    }
    $freq = array_count_values(array_map('strval', $data));
    arsort($freq);
    $maxFreq = reset($freq);
    if ($maxFreq === 1) {
        return null; // No hay moda si todos aparecen una sola vez
    }
    $modas = array();
    foreach ($freq as $val => $count) {
        if ($count === $maxFreq) {
            $modas[] = floatval($val);
        }
    }
    return count($modas) === 1 ? $modas[0] : $modas;
}

/**
 * Calcula la varianza de un array de valores numericos
 *
 * @param array $data
 * @return float
 */
function stat_varianza($data)
{
    $data = array_filter($data, 'is_numeric');
    $data = array_values($data);
    if (count($data) < 2) {
        return 0;
    }
    $media = stat_media($data);
    $sum = 0;
    foreach ($data as $val) {
        $sum += pow($val - $media, 2);
    }
    return $sum / (count($data) - 1); // Varianza muestral
}

/**
 * Calcula la desviacion estandar
 *
 * @param array $data
 * @return float
 */
function stat_desviacion_estandar($data)
{
    return sqrt(stat_varianza($data));
}

/**
 * Calcula el coeficiente de correlacion de Pearson entre dos arrays
 *
 * @param array $x
 * @param array $y
 * @return float
 */
function stat_correlacion($x, $y)
{
    $x = array_filter($x, 'is_numeric');
    $y = array_filter($y, 'is_numeric');
    $x = array_values($x);
    $y = array_values($y);

    $n = min(count($x), count($y));
    if ($n < 2) {
        return 0;
    }

    $x = array_slice($x, 0, $n);
    $y = array_slice($y, 0, $n);

    $mediaX = stat_media($x);
    $mediaY = stat_media($y);

    $sumXY = 0;
    $sumX2 = 0;
    $sumY2 = 0;

    for ($i = 0; $i < $n; $i++) {
        $dx = $x[$i] - $mediaX;
        $dy = $y[$i] - $mediaY;
        $sumXY += $dx * $dy;
        $sumX2 += $dx * $dx;
        $sumY2 += $dy * $dy;
    }

    $denom = sqrt($sumX2 * $sumY2);
    if ($denom == 0) {
        return 0;
    }

    return $sumXY / $denom;
}

/**
 * Genera una tabla de frecuencias
 *
 * @param array $data
 * @return array
 */
function stat_frecuencias($data)
{
    $data = array_filter($data, 'is_numeric');
    $data = array_values($data);
    if (empty($data)) {
        return array();
    }

    $freq = array();
    foreach ($data as $val) {
        $key = strval($val);
        if (!isset($freq[$key])) {
            $freq[$key] = 0;
        }
        $freq[$key]++;
    }

    $total = count($data);
    $result = array();
    foreach ($freq as $val => $count) {
        $result[] = array(
            'valor' => floatval($val),
            'frecuencia_absoluta' => $count,
            'frecuencia_relativa' => round($count / $total, 4),
            'porcentaje' => round(($count / $total) * 100, 2)
        );
    }

    // Ordenar por valor
    usort($result, function ($a, $b) {
        return $a['valor'] < $b['valor'] ? -1 : ($a['valor'] > $b['valor'] ? 1 : 0);
    });

    return $result;
}

/**
 * Aplica una operacion estadistica a un dataset
 *
 * @param string $operacion
 * @param array $data Datos de la columna
 * @param array|null $data2 Datos de segunda columna (para correlacion)
 * @return mixed
 */
function aplicar_operacion($operacion, $data, $data2 = null)
{
    switch ($operacion) {
        case 'media':
            return round(stat_media($data), 4);
        case 'mediana':
            return round(stat_mediana($data), 4);
        case 'moda':
            return stat_moda($data);
        case 'desviacion_estandar':
            return round(stat_desviacion_estandar($data), 4);
        case 'varianza':
            return round(stat_varianza($data), 4);
        case 'correlacion':
            if ($data2 === null) {
                return null;
            }
            return round(stat_correlacion($data, $data2), 4);
        case 'frecuencias':
            return stat_frecuencias($data);
        case 'min':
            $nums = array_filter($data, 'is_numeric');
            return empty($nums) ? null : min($nums);
        case 'max':
            $nums = array_filter($data, 'is_numeric');
            return empty($nums) ? null : max($nums);
        case 'rango':
            $nums = array_filter($data, 'is_numeric');
            return empty($nums) ? null : round(max($nums) - min($nums), 4);
        default:
            return null;
    }
}

// =============================================
// Endpoints
// =============================================

// GET /api/lab/experiments/{sessionId} - Listar experimentos de una sesion
$router->get('/api/lab/experiments/{sessionId}', function ($router) {
    $user = Middleware::authenticate();
    $sessionId = $router->getParam('sessionId');

    $db = Database::getInstance();

    // Verificar que la sesion existe y es de tipo laboratorio
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND mode = ?');
    $stmt->execute(array($sessionId, 'laboratorio'));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada o no es de tipo laboratorio', 404);
    }

    // Obtener experimentos
    $stmt = $db->prepare(
        'SELECT * FROM lab_experiments WHERE session_id = ? ORDER BY created_at ASC'
    );
    $stmt->execute(array($sessionId));
    $experiments = $stmt->fetchAll();

    // Para cada experimento, decodificar JSON e incluir intento del estudiante
    foreach ($experiments as &$exp) {
        $exp['dataset'] = json_decode($exp['dataset'], true);
        $exp['dataset_headers'] = json_decode($exp['dataset_headers'], true);
        $exp['expected_analysis'] = json_decode($exp['expected_analysis'], true);

        if ($user['role'] === 'estudiante') {
            // No mostrar expected_analysis al estudiante
            unset($exp['expected_analysis']);

            // Incluir intento del estudiante si existe
            $stmtAttempt = $db->prepare(
                'SELECT * FROM lab_attempts WHERE experiment_id = ? AND student_id = ?'
            );
            $stmtAttempt->execute(array($exp['id'], $user['id']));
            $attempt = $stmtAttempt->fetch();

            if ($attempt) {
                $attempt['analysis_results'] = json_decode($attempt['analysis_results'], true);
                $exp['attempt'] = $attempt;
            } else {
                $exp['attempt'] = null;
            }
        }
    }
    unset($exp);

    Response::success($experiments);
});

// POST /api/lab/experiments - Crear experimento (solo docente)
$router->post('/api/lab/experiments', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('docente', $user);

    $request = $router->getRequest();
    $body = $request->body();

    // Validar campos requeridos
    $required = array('session_id', 'title', 'dataset', 'dataset_headers');
    foreach ($required as $field) {
        if (empty($body[$field])) {
            Response::error($field . ' es requerido', 400);
        }
    }

    $db = Database::getInstance();

    // Verificar que la sesion existe, es de tipo laboratorio y pertenece al docente
    $stmt = $db->prepare('SELECT * FROM sessions WHERE id = ? AND teacher_id = ? AND mode = ?');
    $stmt->execute(array($body['session_id'], $user['id'], 'laboratorio'));
    $session = $stmt->fetch();

    if (!$session) {
        Response::error('Sesion no encontrada, no es de tipo laboratorio o no tienes permisos', 404);
    }

    $dataset = is_string($body['dataset']) ? $body['dataset'] : json_encode($body['dataset']);
    $datasetHeaders = is_string($body['dataset_headers']) ? $body['dataset_headers'] : json_encode($body['dataset_headers']);
    $expectedAnalysis = isset($body['expected_analysis'])
        ? (is_string($body['expected_analysis']) ? $body['expected_analysis'] : json_encode($body['expected_analysis']))
        : '{}';
    $description = isset($body['description']) ? $body['description'] : '';
    $instructions = isset($body['instructions']) ? $body['instructions'] : '';
    $difficulty = isset($body['difficulty']) ? (int)$body['difficulty'] : 1;

    $stmt = $db->prepare(
        'INSERT INTO lab_experiments (session_id, title, description, dataset, dataset_headers, expected_analysis, instructions, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $body['session_id'],
        $body['title'],
        $description,
        $dataset,
        $datasetHeaders,
        $expectedAnalysis,
        $instructions,
        $difficulty
    ));

    $experimentId = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM lab_experiments WHERE id = ?');
    $stmt->execute(array($experimentId));
    $experiment = $stmt->fetch();
    $experiment['dataset'] = json_decode($experiment['dataset'], true);
    $experiment['dataset_headers'] = json_decode($experiment['dataset_headers'], true);
    $experiment['expected_analysis'] = json_decode($experiment['expected_analysis'], true);

    Response::success($experiment, 'Experimento creado exitosamente');
});

// POST /api/lab/attempts - Iniciar intento (solo estudiante)
$router->post('/api/lab/attempts', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['experiment_id'])) {
        Response::error('experiment_id es requerido', 400);
    }

    $db = Database::getInstance();

    // Verificar que el experimento existe
    $stmt = $db->prepare('SELECT e.*, s.id as sid FROM lab_experiments e JOIN sessions s ON s.id = e.session_id WHERE e.id = ?');
    $stmt->execute(array($body['experiment_id']));
    $experiment = $stmt->fetch();

    if (!$experiment) {
        Response::error('Experimento no encontrado', 404);
    }

    // Verificar que el estudiante esta inscrito en la sesion
    $stmt = $db->prepare('SELECT id FROM session_students WHERE session_id = ? AND student_id = ?');
    $stmt->execute(array($experiment['session_id'], $user['id']));
    if (!$stmt->fetch()) {
        Response::error('No estas inscrito en esta sesion', 403);
    }

    // Verificar si ya tiene un intento
    $stmt = $db->prepare('SELECT * FROM lab_attempts WHERE experiment_id = ? AND student_id = ?');
    $stmt->execute(array($body['experiment_id'], $user['id']));
    $existing = $stmt->fetch();

    if ($existing) {
        $existing['analysis_results'] = json_decode($existing['analysis_results'], true);
        Response::success($existing, 'Ya tienes un intento en este experimento');
    }

    $stmt = $db->prepare(
        'INSERT INTO lab_attempts (experiment_id, student_id, analysis_results, status)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $body['experiment_id'],
        $user['id'],
        '{}',
        'en_progreso'
    ));

    $attemptId = $db->lastInsertId();

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'lab_experiment_started',
        0,
        json_encode(array('experiment_id' => (int)$body['experiment_id'], 'attempt_id' => (int)$attemptId))
    ));

    $stmt = $db->prepare('SELECT * FROM lab_attempts WHERE id = ?');
    $stmt->execute(array($attemptId));
    $attempt = $stmt->fetch();
    $attempt['analysis_results'] = json_decode($attempt['analysis_results'], true);

    Response::success($attempt, 'Intento iniciado exitosamente');
});

// PUT /api/lab/attempts/{id} - Guardar progreso
$router->put('/api/lab/attempts/{id}', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $attemptId = $router->getParam('id');
    $request = $router->getRequest();
    $body = $request->body();

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM lab_attempts WHERE id = ? AND student_id = ?');
    $stmt->execute(array($attemptId, $user['id']));
    $attempt = $stmt->fetch();

    if (!$attempt) {
        Response::error('Intento no encontrado', 404);
    }

    if ($attempt['status'] === 'completado') {
        Response::error('Este intento ya fue completado', 400);
    }

    $fields = array();
    $values = array();

    if (isset($body['analysis_results'])) {
        $fields[] = 'analysis_results = ?';
        $values[] = is_string($body['analysis_results']) ? $body['analysis_results'] : json_encode($body['analysis_results']);
    }

    if (isset($body['interpretation'])) {
        $fields[] = 'interpretation = ?';
        $values[] = $body['interpretation'];
    }

    if (empty($fields)) {
        Response::error('No se proporcionaron campos para actualizar', 400);
    }

    $values[] = $attemptId;
    $sql = 'UPDATE lab_attempts SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    $stmt = $db->prepare('SELECT * FROM lab_attempts WHERE id = ?');
    $stmt->execute(array($attemptId));
    $updated = $stmt->fetch();
    $updated['analysis_results'] = json_decode($updated['analysis_results'], true);

    Response::success($updated, 'Progreso guardado');
});

// POST /api/lab/attempts/{id}/submit - Enviar analisis
$router->post('/api/lab/attempts/{id}/submit', function ($router) {
    $user = Middleware::authenticate();
    Middleware::requireRole('estudiante', $user);

    $attemptId = $router->getParam('id');

    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM lab_attempts WHERE id = ? AND student_id = ?');
    $stmt->execute(array($attemptId, $user['id']));
    $attempt = $stmt->fetch();

    if (!$attempt) {
        Response::error('Intento no encontrado', 404);
    }

    if ($attempt['status'] === 'completado') {
        Response::error('Este intento ya fue completado', 400);
    }

    // Obtener el experimento con el analisis esperado
    $stmt = $db->prepare('SELECT * FROM lab_experiments WHERE id = ?');
    $stmt->execute(array($attempt['experiment_id']));
    $experiment = $stmt->fetch();

    $expectedAnalysis = json_decode($experiment['expected_analysis'], true);
    $studentResults = json_decode($attempt['analysis_results'], true);
    $dataset = json_decode($experiment['dataset'], true);
    $headers = json_decode($experiment['dataset_headers'], true);

    $totalPoints = 0;
    $earnedPoints = 0;

    // Evaluar medidas estadisticas
    if (isset($expectedAnalysis['measures']) && is_array($expectedAnalysis['measures'])) {
        foreach ($expectedAnalysis['measures'] as $measure) {
            $totalPoints += 10;

            // Verificar si el estudiante calculo esta medida para alguna columna
            $found = false;
            if (is_array($studentResults)) {
                foreach ($studentResults as $key => $value) {
                    // Las claves de resultados pueden ser "media_columna1", etc.
                    if (strpos($key, $measure) !== false) {
                        // Calcular el valor esperado
                        $parts = explode('_', $key);
                        $colName = end($parts);
                        $colIndex = array_search($colName, $headers);

                        if ($colIndex !== false && isset($dataset[0])) {
                            // Extraer datos de la columna
                            $colData = array();
                            foreach ($dataset as $row) {
                                if (isset($row[$colIndex]) && is_numeric($row[$colIndex])) {
                                    $colData[] = floatval($row[$colIndex]);
                                }
                            }

                            if (!empty($colData)) {
                                $expectedValue = aplicar_operacion($measure, $colData);
                                if ($expectedValue !== null && is_numeric($expectedValue) && is_numeric($value)) {
                                    // Tolerancia del 5%
                                    $tolerance = abs($expectedValue) * 0.05;
                                    if ($tolerance < 0.01) {
                                        $tolerance = 0.01;
                                    }
                                    if (abs($value - $expectedValue) <= $tolerance) {
                                        $earnedPoints += 10;
                                        $found = true;
                                        break;
                                    }
                                }
                            }
                        }

                        // Si no pudimos verificar por columna, al menos encontro la medida
                        if (!$found) {
                            $earnedPoints += 5; // Puntos parciales por intentarlo
                            $found = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // Evaluar correlaciones
    if (isset($expectedAnalysis['correlations']) && is_array($expectedAnalysis['correlations'])) {
        foreach ($expectedAnalysis['correlations'] as $corrPair) {
            $totalPoints += 15;

            if (is_array($studentResults)) {
                foreach ($studentResults as $key => $value) {
                    if (strpos($key, 'correlacion') !== false && is_numeric($value)) {
                        // Calcular correlacion esperada
                        if (is_array($corrPair) && count($corrPair) >= 2) {
                            $col1Index = is_numeric($corrPair[0]) ? (int)$corrPair[0] : array_search($corrPair[0], $headers);
                            $col2Index = is_numeric($corrPair[1]) ? (int)$corrPair[1] : array_search($corrPair[1], $headers);

                            if ($col1Index !== false && $col2Index !== false) {
                                $colData1 = array();
                                $colData2 = array();
                                foreach ($dataset as $row) {
                                    if (isset($row[$col1Index]) && isset($row[$col2Index]) && is_numeric($row[$col1Index]) && is_numeric($row[$col2Index])) {
                                        $colData1[] = floatval($row[$col1Index]);
                                        $colData2[] = floatval($row[$col2Index]);
                                    }
                                }
                                $expectedCorr = stat_correlacion($colData1, $colData2);
                                $tolerance = 0.05;
                                if (abs($value - $expectedCorr) <= $tolerance) {
                                    $earnedPoints += 15;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    // Evaluar interpretacion
    if (isset($expectedAnalysis['interpretation_keywords']) && is_array($expectedAnalysis['interpretation_keywords'])) {
        $interpretation = isset($attempt['interpretation']) ? strtolower($attempt['interpretation']) : '';
        $keywordsTotal = count($expectedAnalysis['interpretation_keywords']);
        $keywordsFound = 0;

        if ($keywordsTotal > 0) {
            $totalPoints += $keywordsTotal * 5;
            foreach ($expectedAnalysis['interpretation_keywords'] as $keyword) {
                if (strpos($interpretation, strtolower($keyword)) !== false) {
                    $keywordsFound++;
                    $earnedPoints += 5;
                }
            }
        }
    }

    // Calcular score final (0-100)
    $score = $totalPoints > 0 ? (int)round(($earnedPoints / $totalPoints) * 100) : 0;

    // Bonus: si no hay expected_analysis definido, dar puntos por completar
    if (empty($expectedAnalysis) || ($totalPoints === 0)) {
        // Sin analisis esperado, puntuar por haber hecho algo
        $hasResults = !empty($studentResults) && count($studentResults) > 0;
        $hasInterpretation = !empty($attempt['interpretation']) && strlen(trim($attempt['interpretation'])) > 20;
        $score = 0;
        if ($hasResults) {
            $score += 50;
        }
        if ($hasInterpretation) {
            $score += 50;
        }
    }

    // Actualizar intento
    $stmt = $db->prepare(
        'UPDATE lab_attempts SET status = ?, score = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    $stmt->execute(array('completado', $score, $attemptId));

    // Calcular XP basado en score y dificultad
    $difficulty = (int)$experiment['difficulty'];
    $baseXP = 50;
    $xpEarned = (int)round($baseXP * ($score / 100) * $difficulty);
    if ($xpEarned < 10) {
        $xpEarned = 10; // Minimo 10 XP por intentar
    }

    // Dar XP al estudiante
    $stmt = $db->prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
    $stmt->execute(array($xpEarned, $user['id']));

    // Registrar actividad
    $stmt = $db->prepare(
        'INSERT INTO activity_log (user_id, action, xp_earned, details) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute(array(
        $user['id'],
        'lab_experiment_completed',
        $xpEarned,
        json_encode(array(
            'experiment_id' => (int)$attempt['experiment_id'],
            'attempt_id' => (int)$attemptId,
            'score' => $score
        ))
    ));

    // Verificar subida de nivel
    if (function_exists('checkLevelUp')) {
        checkLevelUp($db, $user['id']);
    }

    Response::success(array(
        'score' => $score,
        'xp_earned' => $xpEarned,
        'status' => 'completado'
    ), 'Analisis enviado exitosamente');
});

// POST /api/lab/calculate - Calcular estadisticas
$router->post('/api/lab/calculate', function ($router) {
    $user = Middleware::authenticate();

    $request = $router->getRequest();
    $body = $request->body();

    if (empty($body['dataset']) || empty($body['operations'])) {
        Response::error('dataset y operations son requeridos', 400);
    }

    $dataset = $body['dataset']; // Array 2D
    $operations = $body['operations']; // Array de operaciones a realizar
    $columnIndex = isset($body['column_index']) ? (int)$body['column_index'] : null;
    $columnIndex2 = isset($body['column_index_2']) ? (int)$body['column_index_2'] : null;

    // Extraer datos de la columna especificada
    $colData = array();
    $colData2 = array();

    if ($columnIndex !== null) {
        foreach ($dataset as $row) {
            if (isset($row[$columnIndex]) && is_numeric($row[$columnIndex])) {
                $colData[] = floatval($row[$columnIndex]);
            }
        }
    }

    if ($columnIndex2 !== null) {
        foreach ($dataset as $row) {
            if (isset($row[$columnIndex2]) && is_numeric($row[$columnIndex2])) {
                $colData2[] = floatval($row[$columnIndex2]);
            }
        }
    }

    if (empty($colData) && $columnIndex !== null) {
        Response::error('La columna seleccionada no contiene datos numericos', 400);
    }

    $results = array();

    if (!is_array($operations)) {
        $operations = array($operations);
    }

    foreach ($operations as $op) {
        if ($op === 'correlacion') {
            $results[$op] = aplicar_operacion($op, $colData, $colData2);
        } else {
            $results[$op] = aplicar_operacion($op, $colData);
        }
    }

    Response::success($results, 'Calculos realizados exitosamente');
});
