-- =============================================
-- MIMI - Schema de Base de Datos SQLite
-- Mi Mentor de Investigacion
-- =============================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Tabla de usuarios
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
);

-- Tabla de sesiones
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
);

-- Tabla de estudiantes en sesiones
CREATE TABLE IF NOT EXISTS session_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'activo' CHECK(status IN ('activo', 'completado', 'abandonado')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(session_id, student_id)
);

-- Tabla de protocolos de investigacion
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
);

-- Tabla de validaciones de coherencia
CREATE TABLE IF NOT EXISTS validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocol_id INTEGER NOT NULL,
    field TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'incompleto' CHECK(status IN ('valido', 'incoherente', 'incompleto')),
    message TEXT,
    suggestion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

-- Tabla de micro defensas
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
);

-- Tabla de insignias
CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL DEFAULT 'nivel' CHECK(category IN ('nivel', 'tematica')),
    criteria TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de insignias obtenidas por usuarios
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

-- Tabla de registro de actividad
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    details TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de recursos educativos
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('video', 'referencia', 'plantilla', 'glosario')),
    content TEXT,
    category TEXT NOT NULL DEFAULT 'conceptual' CHECK(category IN ('conceptual', 'procedimental', 'caso_resuelto')),
    keywords TEXT,
    min_level INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Indices para optimizar consultas
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_students_session ON session_students(session_id);
CREATE INDEX IF NOT EXISTS idx_session_students_student ON session_students(student_id);
CREATE INDEX IF NOT EXISTS idx_protocols_student ON protocols(student_id);
CREATE INDEX IF NOT EXISTS idx_protocols_session ON protocols(session_id);
CREATE INDEX IF NOT EXISTS idx_protocols_status ON protocols(status);
CREATE INDEX IF NOT EXISTS idx_validations_protocol ON validations(protocol_id);
CREATE INDEX IF NOT EXISTS idx_micro_defenses_protocol ON micro_defenses(protocol_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
