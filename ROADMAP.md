# MIMI - Roadmap de Desarrollo

Estado actual del proyecto y lo que falta por implementar.

---

## Stack implementado

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4, Zustand 5, TanStack Query 5, React Router 7, Lucide React |
| Backend | PHP vanilla (7.4+), SQLite via PDO, JWT manual con hash_hmac |
| UI | Componentes estilo shadcn/ui con class-variance-authority, paleta Apple-like |

---

## Lo que YA esta hecho

### Backend (20 archivos PHP + schema SQL)

- Router con soporte para parametros dinamicos `{id}`
- Auth JWT completo (register, login, verificacion)
- Middleware de autenticacion y autorizacion por rol
- CRUD completo de sesiones (crear, editar, eliminar, unirse, listar estudiantes)
- CRUD completo de protocolos (7 pasos del constructor)
- Validador de coherencia metodologica (`CoherenceValidator.php`)
- Generador de micro-defensas con objeciones contextualizadas (`MicroDefenseGenerator.php`)
- Sistema de XP, niveles e insignias
- Dashboard docente con analytics
- CRUD de recursos educativos
- Instalador web (`install.php`) con verificacion de requisitos y datos seed
- Auto-deteccion de subdirectorio (funciona en raiz o cualquier carpeta)
- CORS dinamico, proteccion de archivos sensibles via .htaccess

**27 endpoints API** en total:
- Auth: 3 (register, login, me)
- Sesiones: 7 (CRUD + join + students)
- Protocolos: 8 (CRUD + validate + submit + review + defense)
- Progreso: 3 (me, levels, activity)
- Recursos: 3 (list, detail, create)
- Dashboard: 3 (overview, students, session analytics)

### Frontend (77 archivos TypeScript)

- 15 componentes UI base (Button, Card, Input, Dialog, Select, Tabs, Progress, etc.)
- Layouts completos (Navbar, Sidebar, Footer, StudentLayout, TeacherLayout)
- Auth completo (LoginForm, RegisterForm, ProtectedRoute, store Zustand)
- Constructor wizard de 7 pasos (StepProblem, StepQuestion, StepObjectives, StepVariables, StepDesign, StepSample, StepInstruments)
- Mapa de coherencia visual (CoherenceMap)
- Componente de micro-defensa (MicroDefense)
- Alertas de validacion (ValidationAlert)
- Dashboard estudiante y docente con StatsCard y ProgressRing
- Gestion de sesiones (lista, card, crear, detalle)
- Sistema de progreso (XPBar, LevelBadge, BadgeGrid, LevelUpModal)
- Recursos (ResourceLibrary, VideoPlayer, GlossaryTerm)
- 14 paginas con routing completo
- Hooks de TanStack Query para todas las entidades
- Stores Zustand (auth + ui)
- Build exitoso: ~391KB JS + ~48KB CSS (gzipped: ~112KB + ~8KB)

### Infraestructura

- `install.php` con UI visual para instalacion desde el navegador
- `schema.sql` con 10 tablas + 15 indices
- Datos seed: 4 insignias, 1 admin, 5 recursos de ejemplo
- `.htaccess` para URL rewriting y seguridad
- `.env.production` para configurar URL del backend
- Proxy de Vite para desarrollo local

---

## Lo que FALTA

### Prioridad CRITICA (sin esto no se puede usar en produccion)

- [ ] **Testing end-to-end real** — Registrar usuarios, crear sesiones, completar un protocolo de 7 pasos, verificar que todo el flujo funciona de principio a fin
- [x] **.htaccess para SPA en frontend** — Fallback a `index.html` + cache de assets + gzip
- [x] **Validar constructor completo** — Backend realineado (7 pasos sin hipotesis obligatoria), rutas corregidas, campos alineados frontend↔backend
- [x] **Manejo de errores robusto en frontend** — Sistema de Toast global, catch blocks arreglados, estados de error visibles, imports limpiados

### Prioridad ALTA (mejora significativa de la experiencia)

- [x] **Validacion de formularios visual** — Validacion por campo con bordes rojos, mensajes inline, estados touched/submitted en Login, Register y CreateSession
- [x] **Responsive final** — Landing (hero, features, steps), stepper del constructor, dashboards y cards de sesiones optimizados para movil
- [x] **Mejorar datos seed** — +4 insignias, +8 recursos educativos, +3 sesiones con escenarios de ejemplo
- [x] **Exportar protocolo** — Generacion HTML + window.print() para guardar como PDF con todas las secciones del protocolo
- [x] **Paginacion** — Componente Pagination reutilizable + hook usePagination, integrado en sesiones (estudiante/docente) y recursos

### Prioridad MEDIA (completar funcionalidad planificada)

- [ ] **Busqueda y filtros en frontend** — Los endpoints de backend soportan filtros pero el frontend no los implementa todos
- [ ] **Activity log consistente** — La tabla `activity_log` existe pero no se llena en todas las acciones
- [x] **Notificaciones (Toast)** — Sistema de toasts globales implementado (success/error/info)
- [ ] **Modo oscuro** — La infraestructura CSS esta lista pero falta el toggle y las variables dark
- [ ] **Recuperacion de contrasena** — No hay flujo de "olvide mi contrasena"
- [ ] **Subida de avatar** — El campo existe en la DB pero no hay endpoint de upload de archivos

### Prioridad BAJA (fases futuras del plan)

- [ ] **Modo Detective Metodologico** — No implementado. Requiere: sistema de casos con errores marcados, interfaz de anotacion, arbol de errores, sistema de pistas
- [ ] **Modo Laboratorio Estadistico** — No implementado. Requiere: carga de datasets, motor de analisis estadistico, visualizacion de resultados
- [ ] **Simulador de defensa de tesis** — No implementado. Requiere: generacion de preguntas personalizadas, cronometro, evaluacion de respuestas
- [ ] **Certificacion digital** — No implementado. Requiere: generacion de PDF/imagen, codigo QR verificable
- [ ] **Rate limiting** — Proteger endpoints publicos (login, register) contra fuerza bruta
- [ ] **Internacionalizacion** — Todo esta en espanol; no hay sistema i18n
- [ ] **Integracion con LMS** — API para Moodle, Canvas, etc.
- [ ] **App movil** — PWA o React Native

---

## Estructura de archivos

```
mimi/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # 15 componentes (Button, Card, Input, Dialog...)
│   │   │   ├── layout/         # Navbar, Sidebar, Footer, StudentLayout, TeacherLayout
│   │   │   ├── auth/           # LoginForm, RegisterForm, ProtectedRoute
│   │   │   ├── constructor/    # Wizard 7 pasos + CoherenceMap + MicroDefense
│   │   │   ├── dashboard/      # StatsCard, ProgressRing, StudentDashboard, TeacherDashboard
│   │   │   ├── sessions/       # SessionCard, SessionList, CreateSessionForm, SessionDetail
│   │   │   ├── progress/       # LevelBadge, XPBar, BadgeGrid, LevelUpModal
│   │   │   └── resources/      # VideoPlayer, ResourceLibrary, GlossaryTerm
│   │   ├── pages/              # 14 paginas (Landing, Login, Register + student/* + teacher/*)
│   │   ├── hooks/              # useAuth, useSessions, useProtocol, useProgress
│   │   ├── stores/             # authStore, uiStore (Zustand)
│   │   ├── lib/                # api.ts, auth.ts, utils.ts
│   │   └── types/              # Interfaces TypeScript
│   ├── .env.production
│   └── vite.config.ts
│
├── backend/
│   ├── core/                   # Database, Router, Request, Response, Auth, Middleware
│   ├── routes/                 # auth, sessions, protocols, progress, resources, dashboard
│   ├── validators/             # CoherenceValidator, MicroDefenseGenerator
│   ├── migrations/             # 001_initial.php
│   ├── data/                   # mimi.db + .htaccess protector
│   ├── config.php              # Auto-detecta subdirectorio, CORS, JWT_SECRET
│   ├── index.php               # Entry point
│   ├── install.php             # Instalador web
│   ├── schema.sql              # DDL completo
│   └── .htaccess               # URL rewriting + seguridad
│
├── README.md                   # Documento del proyecto (pitch/vision)
└── ROADMAP.md                  # Este archivo
```

---

## Como desplegar

### Frontend
1. Editar `frontend/.env.production` → `VITE_API_URL` apuntando al backend
2. `cd frontend && npm install && npm run build`
3. Subir contenido de `frontend/dist/` al servidor
4. Agregar `.htaccess` con fallback a `index.html` para SPA routing

### Backend
1. Subir carpeta `backend/` al servidor
2. Editar `config.php` → cambiar `JWT_SECRET`
3. Abrir `install.php` en el navegador → crea DB + tablas + seed
4. Eliminar o proteger `install.php`

### Desarrollo local
```bash
# Terminal 1
cd frontend && npm run dev          # puerto 5173

# Terminal 2
cd backend && php -S localhost:8080  # puerto 8080

# Vite proxea /api -> localhost:8080
# Abrir http://localhost:5173
# Ejecutar http://localhost:8080/install.php una vez
```
