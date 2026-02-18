import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import RegisterForm from '@/components/auth/RegisterForm'

export default function Register() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground tracking-tight">MIMI</span>
        </Link>

        {/* Form */}
        <RegisterForm />
      </div>
    </div>
  )
}
