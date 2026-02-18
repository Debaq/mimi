import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Star, Award, Trophy, Crown, Gem } from 'lucide-react'

interface LevelUpModalProps {
  newLevel: number
  levelName: string
  open: boolean
  onClose: () => void
}

const LEVEL_ICONS: Record<number, React.ElementType> = {
  1: Star,
  2: Award,
  3: Trophy,
  4: Crown,
  5: Gem,
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'text-foreground',
  2: 'text-primary',
  3: 'text-warning',
  4: 'text-success',
  5: 'text-accent',
}

const LEVEL_BG: Record<number, string> = {
  1: 'bg-secondary',
  2: 'bg-primary/10',
  3: 'bg-warning/10',
  4: 'bg-success/10',
  5: 'bg-accent/10',
}

export default function LevelUpModal({ newLevel, levelName, open, onClose }: LevelUpModalProps) {
  const Icon = LEVEL_ICONS[newLevel] || Star
  const color = LEVEL_COLORS[newLevel] || 'text-primary'
  const bg = LEVEL_BG[newLevel] || 'bg-primary/10'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center overflow-hidden">
        {/* Efecto confetti CSS */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-[confetti_2s_ease-out_forwards]"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: [
                  '#6366f1',
                  '#22c55e',
                  '#f59e0b',
                  '#ef4444',
                  '#8b5cf6',
                  '#06b6d4',
                ][Math.floor(Math.random() * 6)],
              }}
            />
          ))}
        </div>

        <DialogHeader className="items-center pt-6">
          <DialogTitle className="sr-only">Subiste de nivel</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Icono grande */}
          <div
            className={`flex size-24 items-center justify-center rounded-full ${bg} animate-[bounce-in_600ms_ease-out]`}
          >
            <Icon className={`size-12 ${color}`} />
          </div>

          {/* Texto celebratorio */}
          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground animate-[fade-in-up_400ms_ease-out_200ms_both]">
              Felicidades!
            </p>
            <p className="text-muted animate-[fade-in-up_400ms_ease-out_400ms_both]">
              Has alcanzado un nuevo nivel
            </p>
          </div>

          {/* Nuevo nivel */}
          <div className="animate-[fade-in-up_400ms_ease-out_600ms_both]">
            <div className={`inline-flex items-center gap-2 rounded-full px-6 py-3 ${bg}`}>
              <Icon className={`size-5 ${color}`} />
              <span className={`text-lg font-bold ${color}`}>
                Nivel {newLevel} - {levelName}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="justify-center">
          <Button onClick={onClose} className="px-8 animate-[fade-in_400ms_ease-out_800ms_both]">
            Continuar
          </Button>
        </DialogFooter>

        {/* Estilos de animacion CSS */}
        <style>{`
          @keyframes confetti {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(400px) rotate(720deg);
              opacity: 0;
            }
          }
          @keyframes bounce-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.15);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes fade-in-up {
            0% {
              transform: translateY(10px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
