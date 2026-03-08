import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from '@/components/ui/Toast'
import { useUiStore } from '@/stores/uiStore'


// Layouts
import StudentLayout from '@/components/layout/StudentLayout'
import TeacherLayout from '@/components/layout/TeacherLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Auth
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Public pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import VerifyCertificate from '@/pages/VerifyCertificate'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentSessions from '@/pages/student/Sessions'
import Constructor from '@/pages/student/Constructor'
import Profile from '@/pages/student/Profile'
import Resources from '@/pages/student/Resources'
import Certificate from '@/pages/student/Certificate'
import Laboratory from '@/pages/student/Laboratory'
import Detective from '@/pages/student/Detective'
import Defense from '@/pages/student/Defense'

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import TeacherSessions from '@/pages/teacher/Sessions'
import CreateSession from '@/pages/teacher/CreateSession'
import SessionDetail from '@/pages/teacher/SessionDetail'
import Students from '@/pages/teacher/Students'
import Library from '@/pages/teacher/Library'
import LMSConfig from '@/pages/teacher/LMSConfig'
import ProtocolReview from '@/pages/teacher/ProtocolReview'

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
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
  }, [theme])

  // Escuchar cambios en la preferencia del sistema cuando el tema es 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '')}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify/:code" element={<VerifyCertificate />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="/certificate/:protocolId" element={<Certificate />} />
            <Route path="/laboratory/:sessionId" element={<Laboratory />} />
            <Route path="/detective/:sessionId" element={<Detective />} />
            <Route path="/defense/:protocolId" element={<Defense />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
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
            <Route path="/teacher/constructor/:sessionId" element={<Constructor />} />
            <Route path="/teacher/protocols/:protocolId" element={<ProtocolReview />} />
            <Route path="/teacher/lms" element={<LMSConfig />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
