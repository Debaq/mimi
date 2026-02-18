import { Link } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Shield,
  Trophy,
  FolderOpen,
  ArrowRight,
  FileText,
  MessageSquare,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const features = [
  {
    icon: FileText,
    title: 'Constructor de Protocolos',
    description:
      'Crea tu protocolo de investigacion paso a paso con guia inteligente y validacion en tiempo real.',
  },
  {
    icon: MessageSquare,
    title: 'Micro-defensas',
    description:
      'Practica la defensa de tu trabajo con preguntas desafiantes generadas por IA.',
  },
  {
    icon: Trophy,
    title: 'Progresion Gamificada',
    description:
      'Gana experiencia, sube de nivel y desbloquea insignias mientras aprendes a investigar.',
  },
  {
    icon: FolderOpen,
    title: 'Biblioteca de Recursos',
    description:
      'Accede a videos, plantillas, referencias y glosarios adaptados a tu nivel.',
  },
]

const steps = [
  {
    icon: BookOpen,
    number: '01',
    title: 'Unete a una sesion',
    description: 'Tu docente crea una sesion y tu te unes con un codigo. Facil y rapido.',
  },
  {
    icon: Shield,
    number: '02',
    title: 'Construye tu protocolo',
    description:
      'Sigue los pasos guiados para desarrollar cada seccion de tu protocolo de investigacion.',
  },
  {
    icon: BarChart3,
    number: '03',
    title: 'Aprende y mejora',
    description:
      'Recibe retroalimentacion, defiende tu trabajo y observa tu progreso en tiempo real.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight">MIMI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Iniciar Sesion
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-24 sm:px-6 lg:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Tu{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mentor de Investigacion
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
              Aprende a construir protocolos de investigacion de manera guiada, interactiva y
              gamificada. MIMI te acompana en cada paso del proceso.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto sm:min-w-[180px]">
                  Comenzar Ahora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[180px]">
                  Iniciar Sesion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Todo lo que necesitas para investigar
            </h2>
            <p className="mt-4 text-lg text-muted">
              Herramientas disenadas para guiarte desde la idea hasta el protocolo completo.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Como funciona?
            </h2>
            <p className="mt-4 text-lg text-muted">
              Tres simples pasos para comenzar tu camino como investigador.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="mb-2 block text-sm font-bold text-primary">{step.number}</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Listo para comenzar?
            </h2>
            <p className="mt-4 text-lg text-muted">
              Crea tu cuenta y empieza a aprender investigacion de forma divertida.
            </p>
            <div className="mt-8">
              <Link to="/register">
                <Button size="lg">
                  Crear mi cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">MIMI</span>
            </div>
            <p className="text-xs text-muted">
              Mi Mentor de Investigacion &middot; &copy; {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
