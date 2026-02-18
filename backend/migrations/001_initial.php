<?php
/**
 * Migracion 001 - Creacion de tablas iniciales
 *
 * @param PDO $db Instancia de PDO
 */
function migration_001_initial($db)
{
    $queries = array();

    // Tabla de usuarios
    $queries[] = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'estudiante' CHECK(role IN ('estudiante', 'docente')),
            level INTEGER NOT NULL DEFAULT 1,
            xp INTEGER NOT NULL DEFAULT 0,
            avatar_url TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ";

    // Tabla de sesiones
    $queries[] = "
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            mode TEXT NOT NULL DEFAULT 'constructor' CHECK(mode IN ('constructor', 'detective', 'laboratorio')),
            difficulty INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('borrador', 'activa', 'cerrada')),
            config TEXT DEFAULT '{}',
            problem_statement TEXT,
            start_date DATETIME,
            end_date DATETIME,
            allow_retries INTEGER NOT NULL DEFAULT 1,
            show_hints INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ";

    // Tabla de estudiantes en sesiones
    $queries[] = "
        CREATE TABLE IF NOT EXISTS session_students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'activo' CHECK(status IN ('activo', 'completado', 'abandonado')),
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(session_id, student_id)
        )
    ";

    // Tabla de protocolos
    $queries[] = "
        CREATE TABLE IF NOT EXISTS protocols (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            session_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'en_progreso' CHECK(status IN ('en_progreso', 'enviado', 'aprobado', 'rechazado')),
            current_step INTEGER NOT NULL DEFAULT 1,
            problem_statement TEXT,
            research_question TEXT,
            general_objective TEXT,
            specific_objectives TEXT DEFAULT '[]',
            hypothesis TEXT,
            variables TEXT DEFAULT '{}',
            research_design TEXT DEFAULT '{}',
            sample TEXT DEFAULT '{}',
            instruments TEXT DEFAULT '[]',
            theoretical_framework TEXT,
            justification TEXT,
            xp_earned INTEGER NOT NULL DEFAULT 0,
            submitted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
    ";

    // Tabla de validaciones
    $queries[] = "
        CREATE TABLE IF NOT EXISTS validations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            protocol_id INTEGER NOT NULL,
            field TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'incompleto' CHECK(status IN ('valido', 'incoherente', 'incompleto')),
            message TEXT,
            suggestion TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
        )
    ";

    // Tabla de micro defensas
    $queries[] = "
        CREATE TABLE IF NOT EXISTS micro_defenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            protocol_id INTEGER NOT NULL,
            step INTEGER NOT NULL,
            objection TEXT NOT NULL,
            student_response TEXT,
            score INTEGER DEFAULT NULL,
            status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'respondida', 'aprobada')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
        )
    ";

    // Tabla de insignias
    $queries[] = "
        CREATE TABLE IF NOT EXISTS badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            icon TEXT,
            category TEXT NOT NULL DEFAULT 'nivel' CHECK(category IN ('nivel', 'tematica')),
            criteria TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ";

    // Tabla de insignias de usuario
    $queries[] = "
        CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_id INTEGER NOT NULL,
            earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
            UNIQUE(user_id, badge_id)
        )
    ";

    // Tabla de registro de actividad
    $queries[] = "
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            xp_earned INTEGER NOT NULL DEFAULT 0,
            details TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ";

    // Tabla de recursos
    $queries[] = "
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('video', 'referencia', 'plantilla', 'glosario')),
            content TEXT,
            category TEXT NOT NULL DEFAULT 'conceptual' CHECK(category IN ('conceptual', 'procedimental', 'caso_resuelto')),
            keywords TEXT,
            min_level INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ";

    // Indices para optimizar consultas
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_session_students_session ON session_students(session_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_session_students_student ON session_students(student_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_protocols_student ON protocols(student_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_protocols_session ON protocols(session_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_protocols_status ON protocols(status)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_validations_protocol ON validations(protocol_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_micro_defenses_protocol ON micro_defenses(protocol_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)";
    $queries[] = "CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)";

    // Ejecutar todas las consultas
    foreach ($queries as $query) {
        $db->exec($query);
    }
}

/**
 * Insertar datos iniciales (badges, admin, recursos de ejemplo)
 *
 * @param PDO $db
 */
function migration_001_seed($db)
{
    // Insertar insignias predeterminadas
    $badges = array(
        array(
            'name' => 'Semilla Metodologica',
            'description' => 'Completaste tu primer protocolo de investigacion',
            'icon' => 'seedling',
            'category' => 'nivel',
            'criteria' => json_encode(array('protocols_completed' => 1))
        ),
        array(
            'name' => 'Observador Sistematico',
            'description' => 'Definiste variables correctamente en 3 protocolos',
            'icon' => 'eye',
            'category' => 'tematica',
            'criteria' => json_encode(array('valid_variables' => 3))
        ),
        array(
            'name' => 'Defensor de Hipotesis',
            'description' => 'Superaste 5 micro defensas con puntuacion alta',
            'icon' => 'shield',
            'category' => 'tematica',
            'criteria' => json_encode(array('defenses_passed' => 5))
        ),
        array(
            'name' => 'Constructor Coherente',
            'description' => 'Obtuviste validacion perfecta en un protocolo completo',
            'icon' => 'puzzle-piece',
            'category' => 'nivel',
            'criteria' => json_encode(array('perfect_validation' => 1))
        )
    );

    $stmtBadge = $db->prepare(
        'INSERT OR IGNORE INTO badges (name, description, icon, category, criteria) VALUES (?, ?, ?, ?, ?)'
    );

    foreach ($badges as $badge) {
        $stmtBadge->execute(array(
            $badge['name'],
            $badge['description'],
            $badge['icon'],
            $badge['category'],
            $badge['criteria']
        ));
    }

    // Insertar usuario admin docente
    $adminPasswordHash = password_hash('admin123', PASSWORD_BCRYPT);
    $stmtAdmin = $db->prepare(
        'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    $stmtAdmin->execute(array(
        'Administrador Docente',
        'admin@mimi.edu',
        $adminPasswordHash,
        'docente'
    ));

    // Insertar recursos de ejemplo
    $resources = array(
        array(
            'title' => 'Como formular una pregunta de investigacion',
            'type' => 'referencia',
            'content' => 'Una buena pregunta de investigacion debe ser clara, especifica, medible y relevante. Debe comenzar con palabras interrogativas como: Como, Cual, Que, En que medida. Evita preguntas que se respondan con si/no. La pregunta debe reflejar la relacion entre las variables que deseas estudiar.',
            'category' => 'conceptual',
            'keywords' => 'pregunta,investigacion,formulacion',
            'min_level' => 1
        ),
        array(
            'title' => 'Tipos de variables en investigacion',
            'type' => 'referencia',
            'content' => 'Variables independientes: Son las que el investigador manipula o selecciona. Variables dependientes: Son las que se miden como resultado. Variables intervinientes: Son las que pueden afectar la relacion entre VI y VD. Es fundamental identificar y definir operacionalmente cada variable.',
            'category' => 'conceptual',
            'keywords' => 'variables,independiente,dependiente,interviniente',
            'min_level' => 1
        ),
        array(
            'title' => 'Plantilla de protocolo de investigacion',
            'type' => 'plantilla',
            'content' => '1. Planteamiento del problema\n2. Pregunta de investigacion\n3. Objetivo general y especificos\n4. Hipotesis\n5. Variables (independiente, dependiente, intervinientes)\n6. Diseno metodologico (tipo, enfoque, alcance)\n7. Muestra y muestreo\n8. Instrumentos de recoleccion\n9. Marco teorico\n10. Justificacion',
            'category' => 'procedimental',
            'keywords' => 'plantilla,protocolo,estructura',
            'min_level' => 1
        ),
        array(
            'title' => 'Ejemplo resuelto: Investigacion sobre habitos de estudio',
            'type' => 'referencia',
            'content' => 'Problema: Los estudiantes universitarios presentan bajo rendimiento academico. Pregunta: Cual es la relacion entre los habitos de estudio y el rendimiento academico de los estudiantes de psicologia de la UNAM en 2024? Objetivo: Determinar la relacion entre habitos de estudio y rendimiento academico. Hipotesis: Existe una relacion positiva entre habitos de estudio sistematicos y el rendimiento academico.',
            'category' => 'caso_resuelto',
            'keywords' => 'ejemplo,habitos,estudio,rendimiento',
            'min_level' => 1
        ),
        array(
            'title' => 'Glosario de terminos metodologicos',
            'type' => 'glosario',
            'content' => 'Hipotesis: Proposicion tentativa que establece una relacion entre variables. Operacionalizacion: Proceso de definir variables en terminos medibles. Muestra: Subconjunto representativo de la poblacion. Validez: Grado en que un instrumento mide lo que pretende medir. Confiabilidad: Consistencia de los resultados al repetir la medicion.',
            'category' => 'conceptual',
            'keywords' => 'glosario,terminos,definiciones,metodologia',
            'min_level' => 1
        )
    );

    $stmtResource = $db->prepare(
        'INSERT INTO resources (title, type, content, category, keywords, min_level) VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($resources as $resource) {
        $stmtResource->execute(array(
            $resource['title'],
            $resource['type'],
            $resource['content'],
            $resource['category'],
            $resource['keywords'],
            $resource['min_level']
        ));
    }
}
