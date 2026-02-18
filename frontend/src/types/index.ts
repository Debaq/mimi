export interface User {
  id: number;
  name: string;
  email: string;
  role: 'estudiante' | 'docente';
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
