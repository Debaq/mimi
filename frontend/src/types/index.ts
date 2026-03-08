export interface User {
  id: number;
  name: string;
  email: string;
  role: 'estudiante' | 'docente' | 'admin';
  level: number;
  xp: number;
  avatar_url: string | null;
  created_at: string;
}

export interface Session {
  id: number;
  teacher_id: number;
  title: string;
  description: string;
  mode: 'constructor' | 'detective' | 'laboratorio';
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  status: 'borrador' | 'activa' | 'cerrada';
  config: Record<string, unknown>;
  problem_statement: string;
  start_date: string;
  end_date: string;
  allow_retries: boolean;
  show_hints: boolean;
  created_at: string;
  student_count?: number;
  teacher_name?: string;
}

export interface Protocol {
  id: number;
  student_id: number;
  session_id: number;
  status: 'en_progreso' | 'enviado' | 'aprobado' | 'rechazado';
  current_step: number;
  problem_statement: string;
  research_question: string;
  general_objective: string;
  specific_objectives: string[];
  hypothesis: string | null;
  variables: Variable[];
  research_design: ResearchDesign;
  sample: Sample;
  instruments: Instrument[];
  theoretical_framework: string;
  justification: string;
  xp_earned: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // Campos opcionales que vienen del backend en GET /protocols/{id}
  validations?: Validation[];
  student_name?: string;
  student_email?: string;
  session_title?: string;
}

export interface Variable {
  name: string;
  type: 'dependiente' | 'independiente' | 'interviniente';
  conceptual_definition: string;
  operational_definition: string;
}

export interface ResearchDesign {
  approach: 'cuantitativo' | 'cualitativo' | 'mixto';
  type: string;
  scope: 'exploratorio' | 'descriptivo' | 'correlacional' | 'explicativo';
}

export interface Sample {
  population: string;
  size: number;
  technique: string;
  justification: string;
}

export interface Instrument {
  name: string;
  type: string;
  description: string;
  variables_measured: string[];
}

export interface Validation {
  id: number;
  protocol_id: number;
  field: string;
  status: 'valido' | 'incoherente' | 'incompleto';
  message: string;
  suggestion: string;
}

export interface MicroDefense {
  id: number;
  protocol_id: number;
  step: number;
  objection: string;
  student_response: string | null;
  score: number | null;
  status: 'pendiente' | 'respondida' | 'aprobada';
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: 'nivel' | 'tematica';
  earned_at?: string;
}

export interface ProgressInfo {
  level: number;
  xp: number;
  next_level_xp: number;
  badges: Badge[];
}

export interface Resource {
  id: number;
  title: string;
  type: 'video' | 'referencia' | 'plantilla' | 'glosario';
  content: string;
  category: 'conceptual' | 'procedimental' | 'caso_resuelto';
  keywords: string;
  min_level: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  xp_earned: number;
  details: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  total_students: number;
  active_sessions: number;
  protocols_submitted: number;
  average_xp: number;
}

export interface Certificate {
  id: number
  protocol_id: number
  student_id: number
  certificate_code: string
  student_name: string
  session_title: string
  approved_at: string
  issued_at: string
}

export interface LabExperiment {
  id: number
  session_id: number
  title: string
  description: string
  dataset: number[][]
  dataset_headers: string[]
  instructions: string
  difficulty: number
  attempt?: LabAttempt | null
}

export interface LabAttempt {
  id: number
  experiment_id: number
  student_id: number
  analysis_results: Record<string, unknown>
  interpretation: string
  score: number
  status: 'en_progreso' | 'completado'
  started_at?: string
  completed_at?: string | null
}

// === Modo Detective Metodologico ===

export interface DetectiveCase {
  id: number
  session_id: number
  title: string
  description: string
  protocol_data: Record<string, unknown>
  difficulty: number
  max_score: number
  time_limit: number
  attempt?: DetectiveAttempt | null
}

export interface DetectiveAttempt {
  id: number
  case_id: number
  student_id: number
  annotations: DetectiveAnnotation[]
  score: number
  errors_found: number
  errors_total: number
  hints_used: number
  time_spent: number
  status: 'en_progreso' | 'completado'
  started_at?: string
  completed_at?: string | null
}

export interface DetectiveAnnotation {
  field: string
  error_id: string
  explanation: string
}

export interface DetectiveError {
  id: string
  field: string
  type: 'incoherencia' | 'ausencia' | 'contradiccion' | 'error_logico' | 'sesgo'
  description: string
  hint?: string
  severity: 'alta' | 'media' | 'baja'
}

export interface DetectiveResult {
  error_id: string
  field: string
  type: string
  description: string
  found: boolean
  student_explanation: string | null
  severity: string
}

export interface DetectiveSubmitResponse {
  score: number
  errors_found: number
  errors_total: number
  xp_earned: number
  results: DetectiveResult[]
}

export interface DetectiveHintResponse {
  hint: {
    field: string
    hint: string
    severity: string
  } | null
  hints_used: number
  score_penalty: number
}

// === Simulador de Defensa de Tesis ===

export interface DefenseSession {
  id: number
  protocol_id: number
  student_id: number
  questions: DefenseQuestion[]
  answers: string[]
  scores: number[]
  overall_score: number
  time_limit: number
  time_spent: number
  status: 'pendiente' | 'en_curso' | 'completada'
  started_at?: string
  completed_at?: string | null
  created_at?: string
}

export interface DefenseQuestion {
  category: string
  text: string
  context?: string
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
