import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from '@/components/ui/Toast'

// Layouts
import StudentLayout from '@/components/layout/StudentLayout'
import TeacherLayout from '@/components/layout/TeacherLayout'

// Auth
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Public pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentSessions from '@/pages/student/Sessions'
import Constructor from '@/pages/student/Constructor'
import Profile from '@/pages/student/Profile'
import Resources from '@/pages/student/Resources'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import TeacherSessions from '@/pages/teacher/Sessions'
import CreateSession from '@/pages/teacher/CreateSession'
import SessionDetail from '@/pages/teacher/SessionDetail'
import Students from '@/pages/teacher/Students'
import Library from '@/pages/teacher/Library'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="estudiante">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/sessions" element={<StudentSessions />} />
            <Route path="/constructor/:sessionId" element={<Constructor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resources" element={<Resources />} />
          </Route>

          {/* Teacher routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="docente">
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/sessions" element={<TeacherSessions />} />
            <Route path="/teacher/sessions/new" element={<CreateSession />} />
            <Route path="/teacher/sessions/:id" element={<SessionDetail />} />
            <Route path="/teacher/students" element={<Students />} />
            <Route path="/teacher/library" element={<Library />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
