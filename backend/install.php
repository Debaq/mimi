<?php
/**
 * MIMI - Script de instalacion
 *
 * Ejecutar UNA SOLA VEZ desde el navegador para:
 * 1. Verificar requisitos del servidor
 * 2. Crear la base de datos SQLite con schema.sql
 * 3. Insertar datos iniciales (badges, admin, recursos)
 * 4. Verificar que todo funciona
 *
 * Despues de ejecutar, se recomienda ELIMINAR este archivo del servidor.
 */

$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
}

// === UI Helpers ===

function out($msg, $type = 'info', $isCli = false)
{
    if ($isCli) {
        $prefixes = array('success' => '[OK]', 'error' => '[!!]', 'warning' => '[--]', 'info' => '[..]');
        $p = isset($prefixes[$type]) ? $prefixes[$type] : '[..]';
        echo $p . ' ' . $msg . "\n";
    } else {
        $icons = array('success' => '&#10004;', 'error' => '&#10008;', 'warning' => '&#9888;', 'info' => '&#8226;');
        $colors = array('success' => '#30D158', 'error' => '#FF3B30', 'warning' => '#FF9F0A', 'info' => '#86868B');
        $icon = isset($icons[$type]) ? $icons[$type] : '&#8226;';
        $color = isset($colors[$type]) ? $colors[$type] : '#86868B';
        echo '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;color:' . $color . '">';
        echo '<span style="font-size:14px">' . $icon . '</span>';
        echo '<span style="font-family:-apple-system,sans-serif;font-size:13px;color:#1D1D1F">' . htmlspecialchars($msg) . '</span>';
        echo '</div>';
    }
}

// === HTML wrapper ===
if (!$isCli) {
    echo '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>MIMI - Instalacion</title>';
    echo '<style>';
    echo 'body{margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;background:#FBFBFD;color:#1D1D1F}';
    echo '.card{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.04)}';
    echo 'h1{font-size:24px;font-weight:600;margin:0 0 4px}';
    echo '.sub{color:#86868B;font-size:14px;margin:0 0 24px}';
    echo '.section{margin:20px 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#86868B}';
    echo '.result{margin-top:24px;padding:16px;border-radius:12px}';
    echo '.ok{background:#30D15810;border:1px solid #30D15830}';
    echo '.fail{background:#FF3B3010;border:1px solid #FF3B3030}';
    echo '.result h3{margin:0 0 8px;font-size:15px}';
    echo '.result p{margin:0;font-size:13px;color:#86868B}';
    echo '.mono{font-family:ui-monospace,monospace;font-size:12px;background:#F5F5F7;padding:2px 6px;border-radius:4px}';
    echo '</style></head><body><div class="card">';
    echo '<h1>MIMI</h1><p class="sub">Mi Mentor de Investigacion &mdash; Instalacion del Backend</p>';
}

$success = true;
$basePath = '';

try {
    // === 1. DETECCION DE RUTAS ===
    if (!$isCli) {
        echo '<div class="section">Deteccion de entorno</div>';
    }

    $appRoot = str_replace('\\', '/', __DIR__);
    out('Directorio del backend: ' . $appRoot, 'info', $isCli);

    // Detectar base path (subdirectorio en URL)
    if (!$isCli) {
        $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME']);
        // Quitar /install.php del final
        $basePath = dirname($scriptName);
        if ($basePath === '/' || $basePath === '.' || $basePath === '\\') {
            $basePath = '';
        }
    }

    out('Base path detectado: ' . ($basePath === '' ? '/ (raiz)' : $basePath), 'success', $isCli);

    // === 2. REQUISITOS ===
    if (!$isCli) {
        echo '<div class="section">Requisitos del sistema</div>';
    }

    // PHP version
    if (version_compare(PHP_VERSION, '7.4.0', '<')) {
        out('PHP 7.4+ requerido. Actual: ' . PHP_VERSION, 'error', $isCli);
        $success = false;
    } else {
        out('PHP ' . PHP_VERSION, 'success', $isCli);
    }

    // PDO SQLite
    if (!extension_loaded('pdo_sqlite')) {
        out('Extension pdo_sqlite NO disponible', 'error', $isCli);
        $success = false;
    } else {
        out('Extension pdo_sqlite disponible', 'success', $isCli);
    }

    // mod_rewrite (solo verificable de forma indirecta)
    if (function_exists('apache_get_modules')) {
        $modules = apache_get_modules();
        if (in_array('mod_rewrite', $modules)) {
            out('mod_rewrite disponible', 'success', $isCli);
        } else {
            out('mod_rewrite NO detectado (puede fallar el routing)', 'warning', $isCli);
        }
    } else {
        out('No se puede verificar mod_rewrite (servidor no Apache o CGI)', 'info', $isCli);
    }

    // Permisos de escritura
    if (is_writable($appRoot)) {
        out('Directorio con permisos de escritura', 'success', $isCli);
    } else {
        out('Sin permisos de escritura en ' . $appRoot, 'error', $isCli);
        $success = false;
    }

    // Verificar schema.sql
    $schemaFile = $appRoot . '/schema.sql';
    if (!file_exists($schemaFile)) {
        out('Archivo schema.sql no encontrado', 'error', $isCli);
        $success = false;
    } else {
        out('Archivo schema.sql encontrado', 'success', $isCli);
    }

    if (!$success) {
        throw new Exception('Requisitos del sistema no cumplidos');
    }

    // === 3. BASE DE DATOS ===
    if (!$isCli) {
        echo '<div class="section">Base de datos</div>';
    }

    $dbPath = $appRoot . '/data/mimi.db';
    $dataDir = dirname($dbPath);

    // Crear directorio data/
    if (!is_dir($dataDir)) {
        if (mkdir($dataDir, 0755, true)) {
            out('Directorio data/ creado', 'success', $isCli);
        } else {
            out('No se pudo crear directorio data/', 'error', $isCli);
            throw new Exception('No se pudo crear data/');
        }
    } else {
        out('Directorio data/ ya existe', 'info', $isCli);
    }

    // Verificar .htaccess de proteccion en data/
    $dataHtaccess = $dataDir . '/.htaccess';
    if (!file_exists($dataHtaccess)) {
        $htContent = "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n";
        file_put_contents($dataHtaccess, $htContent);
        out('Proteccion .htaccess creada en data/', 'success', $isCli);
    }

    // Si ya existe la DB, preguntar
    if (file_exists($dbPath)) {
        out('Base de datos existente sera REEMPLAZADA', 'warning', $isCli);
        unlink($dbPath);
    }

    // Crear y configurar DB
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    out('Conexion SQLite establecida', 'success', $isCli);

    // Ejecutar schema.sql
    $schemaSql = file_get_contents($schemaFile);
    $db->exec($schemaSql);
    out('Schema ejecutado', 'success', $isCli);

    // Asegurar tabla de rate limiting (proteccion contra fuerza bruta)
    $db->exec('CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        attempts INTEGER DEFAULT 1,
        window_start TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, endpoint)
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address, endpoint)');
    out('Tabla rate_limits verificada', 'success', $isCli);

    // Asegurar columnas de password reset en users (migracion para DBs existentes)
    $columns = $db->query("PRAGMA table_info(users)")->fetchAll();
    $columnNames = array_map(function ($col) { return $col['name']; }, $columns);
    if (!in_array('password_reset_token', $columnNames)) {
        $db->exec('ALTER TABLE users ADD COLUMN password_reset_token TEXT DEFAULT NULL');
        $db->exec('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME DEFAULT NULL');
        out('Columnas password_reset agregadas a users', 'success', $isCli);
    } else {
        out('Columnas password_reset ya existen en users', 'info', $isCli);
    }

    // Migracion: agregar rol 'admin' al CHECK constraint de users
    // SQLite no permite ALTER CHECK, asi que recreamos la tabla si el CHECK actual no incluye 'admin'
    $tableInfo = $db->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")->fetch();
    if ($tableInfo && strpos($tableInfo['sql'], "'admin'") === false) {
        $db->exec('BEGIN');
        $db->exec('ALTER TABLE users RENAME TO users_old');
        $db->exec("CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'estudiante' CHECK(role IN ('estudiante', 'docente', 'admin')),
            level INTEGER NOT NULL DEFAULT 1,
            xp INTEGER NOT NULL DEFAULT 0,
            avatar_url TEXT DEFAULT NULL,
            password_reset_token TEXT DEFAULT NULL,
            password_reset_expires DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        $db->exec('INSERT INTO users SELECT * FROM users_old');
        $db->exec('DROP TABLE users_old');
        // Actualizar admin existente al nuevo rol
        $db->exec("UPDATE users SET role = 'admin', name = 'Administrador' WHERE email = 'admin@mimi.edu'");
        $db->exec('COMMIT');
        out('Tabla users migrada con soporte para rol admin', 'success', $isCli);
    } else {
        out('Tabla users ya soporta rol admin', 'info', $isCli);
    }

    // Asegurar tabla de certificados digitales
    $db->exec('CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        protocol_id INTEGER NOT NULL UNIQUE,
        student_id INTEGER NOT NULL,
        certificate_code TEXT NOT NULL UNIQUE,
        student_name TEXT NOT NULL,
        session_title TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (protocol_id) REFERENCES protocols(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code)');
    out('Tabla certificates verificada', 'success', $isCli);

    // === 4. DATOS INICIALES ===
    if (!$isCli) {
        echo '<div class="section">Datos iniciales</div>';
    }

    $db->beginTransaction();

    // Insertar badges
    $badges = array(
        array('Semilla Metodologica', 'Completaste tu primer protocolo de investigacion', 'seedling', 'nivel', json_encode(array('protocols_completed' => 1))),
        array('Observador Sistematico', 'Definiste variables correctamente en 3 protocolos', 'eye', 'tematica', json_encode(array('valid_variables' => 3))),
        array('Defensor de Hipotesis', 'Superaste 5 micro defensas con puntuacion alta', 'shield', 'tematica', json_encode(array('defenses_passed' => 5))),
        array('Constructor Coherente', 'Obtuviste validacion perfecta en un protocolo completo', 'puzzle-piece', 'nivel', json_encode(array('perfect_validation' => 1)))
    );

    $stmtBadge = $db->prepare('INSERT INTO badges (name, description, icon, category, criteria) VALUES (?, ?, ?, ?, ?)');
    foreach ($badges as $b) {
        $stmtBadge->execute($b);
    }
    out('4 insignias creadas', 'success', $isCli);

    // Insertar badges adicionales
    $badgesExtra = array(
        array('Arquitecto de Preguntas', 'Formulaste 10 preguntas de investigacion aprobadas', 'help-circle', 'tematica', json_encode(array('approved_questions' => 10))),
        array('Maestro del Diseno', 'Justificaste correctamente 5 disenos metodologicos', 'compass', 'tematica', json_encode(array('valid_designs' => 5))),
        array('Investigador Asociado', 'Alcanzaste el nivel 3 de experiencia', 'award', 'nivel', json_encode(array('level' => 3))),
        array('Mentor Emergente', 'Completaste todos los recursos educativos disponibles', 'book-open', 'nivel', json_encode(array('resources_completed' => 'all')))
    );

    $stmtBadgeExtra = $db->prepare('INSERT OR IGNORE INTO badges (name, description, icon, category, criteria) VALUES (?, ?, ?, ?, ?)');
    foreach ($badgesExtra as $b) {
        $stmtBadgeExtra->execute($b);
    }
    out('4 insignias adicionales creadas', 'success', $isCli);

    // Insertar usuario admin
    $adminHash = password_hash('admin123', PASSWORD_BCRYPT);
    $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
       ->execute(array('Administrador', 'admin@mimi.edu', $adminHash, 'admin'));
    out('Usuario admin creado', 'success', $isCli);

    // Insertar recursos de ejemplo
    $resources = array(
        array('Como formular una pregunta de investigacion', 'referencia',
              'Una buena pregunta de investigacion debe ser clara, especifica, medible y relevante. Debe comenzar con palabras interrogativas como: Como, Cual, Que, En que medida. Evita preguntas que se respondan con si/no.',
              'conceptual', 'pregunta,investigacion,formulacion', 1),
        array('Tipos de variables en investigacion', 'referencia',
              'Variables independientes: Son las que el investigador manipula o selecciona. Variables dependientes: Son las que se miden como resultado. Variables intervinientes: Son las que pueden afectar la relacion entre VI y VD.',
              'conceptual', 'variables,independiente,dependiente', 1),
        array('Plantilla de protocolo de investigacion', 'plantilla',
              "1. Planteamiento del problema\n2. Pregunta de investigacion\n3. Objetivo general y especificos\n4. Hipotesis\n5. Variables\n6. Diseno metodologico\n7. Muestra y muestreo\n8. Instrumentos\n9. Marco teorico\n10. Justificacion",
              'procedimental', 'plantilla,protocolo,estructura', 1),
        array('Ejemplo: Investigacion sobre habitos de estudio', 'referencia',
              'Problema: Bajo rendimiento academico. Pregunta: Cual es la relacion entre los habitos de estudio y el rendimiento academico? Objetivo: Determinar la relacion entre habitos de estudio y rendimiento.',
              'caso_resuelto', 'ejemplo,habitos,rendimiento', 1),
        array('Glosario de terminos metodologicos', 'glosario',
              'Hipotesis: Proposicion tentativa entre variables. Operacionalizacion: Definir variables en terminos medibles. Muestra: Subconjunto representativo. Validez: Grado en que mide lo que pretende. Confiabilidad: Consistencia de resultados.',
              'conceptual', 'glosario,terminos,metodologia', 1)
    );

    $stmtRes = $db->prepare('INSERT INTO resources (title, type, content, category, keywords, min_level) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($resources as $r) {
        $stmtRes->execute($r);
    }
    out('5 recursos de ejemplo creados', 'success', $isCli);

    // Insertar recursos adicionales
    $resourcesExtra = array(
        array('Disenos de investigacion cuantitativa', 'referencia',
              'Experimental: Manipulacion de variables con grupo control. Cuasi-experimental: Sin asignacion aleatoria. No experimental: Observacion sin manipulacion. Transversal: Un solo momento. Longitudinal: Seguimiento en el tiempo.',
              'conceptual', 'diseno,cuantitativo,experimental', 1),
        array('Tecnicas de muestreo', 'referencia',
              'Probabilistico: Aleatorio simple, estratificado, por conglomerados, sistematico. No probabilistico: Por conveniencia, por cuotas, bola de nieve, intencional. La eleccion depende del tipo de investigacion y los recursos disponibles.',
              'conceptual', 'muestreo,muestra,tecnicas,probabilistico', 1),
        array('Instrumentos de recoleccion de datos', 'referencia',
              'Cuestionario: Preguntas cerradas/abiertas, escalas Likert. Entrevista: Estructurada, semi-estructurada, abierta. Observacion: Participante, no participante. Analisis documental: Revision de registros existentes. Test estandarizado: Instrumentos validados.',
              'conceptual', 'instrumentos,cuestionario,entrevista,observacion', 1),
        array('Como escribir objetivos de investigacion', 'referencia',
              'Use verbos medibles: Determinar, analizar, evaluar, comparar, describir, identificar, establecer. Estructura: Verbo + que se investiga + en quien + donde + cuando. El objetivo general responde a la pregunta de investigacion. Los especificos son pasos para lograr el general.',
              'procedimental', 'objetivos,verbos,general,especifico', 1),
        array('Validez y confiabilidad de instrumentos', 'referencia',
              'Validez de contenido: Juicio de expertos. Validez de constructo: Analisis factorial. Validez de criterio: Correlacion con instrumento patron. Confiabilidad: Alpha de Cronbach (>0.7), test-retest, formas paralelas.',
              'conceptual', 'validez,confiabilidad,cronbach,instrumentos', 2),
        array('Ejemplo: Investigacion correlacional', 'referencia',
              'Problema: Uso excesivo de redes sociales en universitarios. Pregunta: Existe relacion entre el tiempo en redes sociales y el rendimiento academico? Diseno: No experimental, transversal, correlacional. Variables: Tiempo en redes (VI), promedio academico (VD). Muestra: 200 estudiantes por muestreo estratificado.',
              'caso_resuelto', 'ejemplo,correlacional,redes,rendimiento', 1),
        array('Ejemplo: Investigacion experimental', 'referencia',
              'Problema: Bajo aprendizaje en matematicas. Pregunta: El metodo de aprendizaje basado en problemas mejora el rendimiento en matematicas? Diseno: Cuasi-experimental con pre y post test. Variables: Metodo ABP (VI), calificacion en matematicas (VD). Muestra: 2 grupos de 30 estudiantes.',
              'caso_resuelto', 'ejemplo,experimental,ABP,matematicas', 1),
        array('Plantilla de operacionalizacion de variables', 'plantilla',
              "Variable | Definicion conceptual | Definicion operacional | Dimensiones | Indicadores | Instrumento | Items\n--- | --- | --- | --- | --- | --- | ---\n(nombre) | (que es teoricamente) | (como se mide) | (aspectos) | (medidas concretas) | (herramienta) | (preguntas)",
              'procedimental', 'plantilla,operacionalizacion,variables,matriz', 1)
    );

    $stmtResExtra = $db->prepare('INSERT OR IGNORE INTO resources (title, type, content, category, keywords, min_level) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($resourcesExtra as $r) {
        $stmtResExtra->execute($r);
    }
    out('8 recursos adicionales creados', 'success', $isCli);

    // Insertar sesiones de ejemplo con escenarios de problema
    $stmtSession = $db->prepare('INSERT OR IGNORE INTO sessions (teacher_id, title, description, mode, difficulty, status, problem_statement, start_date, end_date, allow_retries, show_hints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    $sessions = array(
        array(1, 'Metodologia I - Grupo A', 'Sesion introductoria al proceso de investigacion cientifica', 'constructor', 'basico', 'activa',
              'En una universidad publica, se ha observado que el 40% de los estudiantes de primer ano reprueban al menos una materia durante su primer semestre. Los directivos han notado que este fenomeno se ha incrementado en los ultimos 3 anos. Se sospecha que factores como los habitos de estudio, el uso de tecnologia y el nivel socioeconomico podrian estar relacionados con este problema. La institucion necesita evidencia cientifica para disenar programas de apoyo efectivos.',
              '2026-02-01', '2026-06-30', 1, 1),
        array(1, 'Metodologia I - Grupo B', 'Sesion con escenario de salud publica', 'constructor', 'intermedio', 'activa',
              'Una clinica comunitaria en una zona urbana ha reportado un aumento del 25% en consultas relacionadas con ansiedad y depresion en adolescentes entre 14 y 18 anos durante el ultimo ano. Los profesionales de salud mental sugieren que el uso excesivo de redes sociales y la falta de actividad fisica podrian ser factores contribuyentes, pero no cuentan con datos sistematizados que confirmen esta hipotesis. Se requiere una investigacion formal para fundamentar intervenciones preventivas.',
              '2026-02-01', '2026-06-30', 1, 1),
        array(1, 'Investigacion Avanzada', 'Sesion con escenario organizacional complejo', 'constructor', 'avanzado', 'activa',
              'Una empresa de tecnologia con 500 empleados ha implementado el modelo de trabajo hibrido (3 dias presencial, 2 remoto) desde hace 18 meses. Los indicadores de productividad muestran resultados mixtos: algunos departamentos mejoraron su rendimiento mientras otros lo redujeron. Ademas, las encuestas internas revelan diferencias significativas en satisfaccion laboral y percepcion de liderazgo entre quienes trabajan mas tiempo remoto versus presencial. La gerencia necesita una investigacion rigurosa para tomar decisiones sobre la politica de trabajo flexible.',
              '2026-03-01', '2026-07-31', 0, 0)
    );

    foreach ($sessions as $s) {
        $stmtSession->execute($s);
    }
    out('3 sesiones de ejemplo creadas', 'success', $isCli);

    // Insertar sesion de ejemplo tipo detective
    $stmtSession->execute(array(
        1,
        'Detective Metodologico - Grupo A',
        'Identifica errores en protocolos de investigacion',
        'detective',
        'basico',
        'activa',
        null,
        '2026-02-01',
        '2026-06-30',
        1,
        1
    ));
    $detectiveSessionId = $db->lastInsertId();
    out('Sesion detective de ejemplo creada (ID: ' . $detectiveSessionId . ')', 'success', $isCli);

    // Insertar casos detective de ejemplo
    $detectiveCases = array(
        array(
            $detectiveSessionId,
            'El Misterio de la Muestra Sesgada',
            'Un protocolo sobre rendimiento academico y uso de redes sociales presenta varios errores metodologicos. Encuentra todos los problemas.',
            json_encode(array(
                'problema' => 'Se ha observado que los estudiantes universitarios que usan redes sociales mas de 4 horas diarias tienen peor rendimiento academico. Se necesita investigar esta relacion.',
                'pregunta' => 'Las redes sociales afectan negativamente el rendimiento academico de los estudiantes?',
                'objetivo_general' => 'Demostrar que las redes sociales causan bajo rendimiento academico en universitarios.',
                'objetivos_especificos' => array(
                    'Medir el tiempo de uso de redes sociales',
                    'Obtener el promedio academico de los estudiantes',
                    'Comprobar la hipotesis planteada'
                ),
                'hipotesis' => 'El uso excesivo de redes sociales causa bajo rendimiento academico.',
                'variables' => array(
                    array('nombre' => 'Redes sociales', 'tipo' => 'independiente', 'definicion' => 'Uso de redes'),
                    array('nombre' => 'Rendimiento', 'tipo' => 'dependiente', 'definicion' => 'Notas del estudiante')
                ),
                'diseno' => array(
                    'enfoque' => 'cuantitativo',
                    'tipo' => 'experimental',
                    'alcance' => 'correlacional'
                ),
                'muestra' => array(
                    'poblacion' => 'Estudiantes universitarios',
                    'tamano' => 15,
                    'tecnica' => 'conveniencia',
                    'justificacion' => 'Se seleccionaron los estudiantes disponibles en la cafeteria'
                ),
                'instrumentos' => array(
                    array('nombre' => 'Encuesta de redes sociales', 'descripcion' => 'Cuestionario de 5 preguntas abiertas')
                )
            )),
            json_encode(array(
                array(
                    'id' => 'err1',
                    'field' => 'pregunta',
                    'type' => 'sesgo',
                    'description' => 'La pregunta de investigacion asume una relacion negativa en vez de ser neutral. Deberia preguntar "cual es la relacion" en vez de "afectan negativamente".',
                    'hint' => 'Revisa si la pregunta es neutral o ya asume un resultado.',
                    'severity' => 'alta'
                ),
                array(
                    'id' => 'err2',
                    'field' => 'objetivo_general',
                    'type' => 'sesgo',
                    'description' => 'El objetivo dice "demostrar" y "causan", lo que implica causalidad y un resultado predeterminado. Deberia usar "determinar" o "analizar".',
                    'hint' => 'Observa el verbo del objetivo general. Es apropiado para investigacion?',
                    'severity' => 'alta'
                ),
                array(
                    'id' => 'err3',
                    'field' => 'diseno',
                    'type' => 'contradiccion',
                    'description' => 'El diseno dice ser "experimental" pero el alcance es "correlacional". Un estudio correlacional no es experimental; deberia ser no experimental.',
                    'hint' => 'Compara el tipo de diseno con el alcance. Son compatibles?',
                    'severity' => 'alta'
                ),
                array(
                    'id' => 'err4',
                    'field' => 'muestra',
                    'type' => 'error_logico',
                    'description' => 'La muestra de 15 estudiantes es insuficiente para un estudio cuantitativo correlacional. Ademas, seleccionar en la cafeteria introduce sesgo de seleccion.',
                    'hint' => 'El tamano de la muestra es adecuado para las conclusiones que se quieren obtener?',
                    'severity' => 'media'
                ),
                array(
                    'id' => 'err5',
                    'field' => 'variables',
                    'type' => 'ausencia',
                    'description' => 'Las definiciones operacionales de las variables son demasiado vagas. "Uso de redes" y "Notas del estudiante" no especifican como se mediran concretamente.',
                    'hint' => 'Las variables tienen definiciones operacionales claras y medibles?',
                    'severity' => 'media'
                )
            )),
            1,
            100,
            30
        ),
        array(
            $detectiveSessionId,
            'El Caso del Diseno Contradictorio',
            'Un protocolo sobre ansiedad y actividad fisica contiene incoherencias entre sus secciones. Detecta las contradicciones y errores logicos.',
            json_encode(array(
                'problema' => 'La ansiedad es un problema creciente entre adolescentes. Diversos estudios sugieren que la actividad fisica regular puede reducir los niveles de ansiedad, pero no hay evidencia local.',
                'pregunta' => 'En que medida la practica regular de actividad fisica se relaciona con los niveles de ansiedad en adolescentes de 14 a 18 anos?',
                'objetivo_general' => 'Analizar la relacion entre la actividad fisica regular y los niveles de ansiedad en adolescentes de 14 a 18 anos de la ciudad.',
                'objetivos_especificos' => array(
                    'Medir los niveles de actividad fisica de los adolescentes',
                    'Evaluar los niveles de ansiedad mediante un instrumento validado',
                    'Correlacionar ambas variables',
                    'Comparar los resultados entre hombres y mujeres'
                ),
                'hipotesis' => 'Existe una relacion inversa significativa entre la actividad fisica regular y los niveles de ansiedad en adolescentes.',
                'variables' => array(
                    array('nombre' => 'Actividad fisica', 'tipo' => 'independiente', 'definicion_conceptual' => 'Movimiento corporal planificado y repetitivo', 'definicion_operacional' => 'Minutos semanales de actividad fisica medidos con el cuestionario IPAQ'),
                    array('nombre' => 'Ansiedad', 'tipo' => 'dependiente', 'definicion_conceptual' => 'Estado emocional de tension y preocupacion', 'definicion_operacional' => 'Puntaje obtenido en el Inventario de Ansiedad de Beck (BAI)')
                ),
                'diseno' => array(
                    'enfoque' => 'cualitativo',
                    'tipo' => 'no experimental, transversal',
                    'alcance' => 'correlacional'
                ),
                'muestra' => array(
                    'poblacion' => 'Adolescentes de 14 a 18 anos de escuelas publicas',
                    'tamano' => 250,
                    'tecnica' => 'estratificado por grado escolar',
                    'justificacion' => 'Calculado con formula de poblaciones finitas con 95% de confianza'
                ),
                'instrumentos' => array(
                    array('nombre' => 'Cuestionario IPAQ', 'descripcion' => 'Cuestionario Internacional de Actividad Fisica, version corta'),
                    array('nombre' => 'Inventario de Beck (BAI)', 'descripcion' => 'Escala de 21 items para medir ansiedad'),
                    array('nombre' => 'Entrevista a profundidad', 'descripcion' => 'Guia semiestructurada de 15 preguntas sobre habitos de actividad fisica')
                )
            )),
            json_encode(array(
                array(
                    'id' => 'err1',
                    'field' => 'diseno',
                    'type' => 'contradiccion',
                    'description' => 'El enfoque dice "cualitativo" pero se usan instrumentos cuantitativos (IPAQ, BAI con puntajes) y el alcance es correlacional. Deberia ser enfoque cuantitativo o mixto.',
                    'hint' => 'El enfoque declarado es coherente con los instrumentos y el alcance?',
                    'severity' => 'alta'
                ),
                array(
                    'id' => 'err2',
                    'field' => 'instrumentos',
                    'type' => 'incoherencia',
                    'description' => 'Se incluye una "entrevista a profundidad" que es un instrumento cualitativo, pero el diseno y analisis planteados son puramente cuantitativos. O se cambia el enfoque a mixto o se elimina la entrevista.',
                    'hint' => 'Todos los instrumentos son coherentes con el enfoque declarado?',
                    'severity' => 'media'
                ),
                array(
                    'id' => 'err3',
                    'field' => 'objetivos_especificos',
                    'type' => 'ausencia',
                    'description' => 'El cuarto objetivo especifico (comparar entre hombres y mujeres) introduce una variable (sexo/genero) que no esta definida en la seccion de variables ni se refleja en el objetivo general.',
                    'hint' => 'Todos los objetivos especificos se derivan del objetivo general y las variables definidas?',
                    'severity' => 'media'
                ),
                array(
                    'id' => 'err4',
                    'field' => 'hipotesis',
                    'type' => 'error_logico',
                    'description' => 'La hipotesis establece una "relacion inversa significativa" pero la pregunta de investigacion solo pregunta "en que medida" se relacionan. La hipotesis deberia ser coherente con la pregunta sin asumir la direccion.',
                    'hint' => 'La hipotesis es coherente con lo que pregunta la pregunta de investigacion?',
                    'severity' => 'baja'
                )
            )),
            2,
            100,
            45
        )
    );

    $stmtCase = $db->prepare(
        'INSERT INTO detective_cases (session_id, title, description, protocol_data, errors, difficulty, max_score, time_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($detectiveCases as $c) {
        $stmtCase->execute($c);
    }
    out('2 casos detective de ejemplo creados', 'success', $isCli);

    $db->commit();

    // === 5. VERIFICACION ===
    if (!$isCli) {
        echo '<div class="section">Verificacion</div>';
    }

    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")->fetchAll();
    foreach ($tables as $t) {
        $count = $db->query("SELECT COUNT(*) as c FROM " . $t['name'])->fetch();
        out($t['name'] . ' (' . $count['c'] . ' registros)', 'info', $isCli);
    }

    // Verificar que el .htaccess principal existe
    $mainHtaccess = $appRoot . '/.htaccess';
    if (file_exists($mainHtaccess)) {
        out('.htaccess principal presente', 'success', $isCli);
    } else {
        out('.htaccess principal NO encontrado - el routing no funcionara', 'error', $isCli);
        $success = false;
    }

    // === RESULTADO ===
    if (!$isCli) {
        echo '<div class="result ok">';
        echo '<h3 style="color:#30D158">Instalacion completada</h3>';
        echo '<p><strong>Admin:</strong> <span class="mono">admin@mimi.edu</span> / <span class="mono">admin123</span> (admin)</p>';
        echo '<p style="margin-top:8px"><strong>API base:</strong> <span class="mono">' . htmlspecialchars($basePath) . '/api/</span></p>';
        echo '<p style="margin-top:12px;color:#FF3B30;font-weight:500">Elimina este archivo (install.php) despues de la instalacion.</p>';
        echo '</div>';
    } else {
        out('', 'info', $isCli);
        out('=== Instalacion completada ===', 'success', $isCli);
        out('Admin: admin@mimi.edu / admin123 (admin)', 'info', $isCli);
        out('API base: ' . ($basePath === '' ? '/' : $basePath) . '/api/', 'info', $isCli);
        out('ELIMINA install.php despues de instalar.', 'warning', $isCli);
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    out('Error: ' . $e->getMessage(), 'error', $isCli);
    $success = false;

    if (!$isCli) {
        echo '<div class="result fail">';
        echo '<h3 style="color:#FF3B30">Instalacion fallida</h3>';
        echo '<p>Revisa los errores y corrige antes de reintentar.</p>';
        echo '</div>';
    }
}

if (!$isCli) {
    echo '</div></body></html>';
}
