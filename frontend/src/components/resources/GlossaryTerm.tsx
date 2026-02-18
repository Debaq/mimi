import { Tooltip } from '@/components/ui/Tooltip'

interface GlossaryTermProps {
  term: string
  definition: string
  className?: string
}

export default function GlossaryTerm({ term, definition, className = '' }: GlossaryTermProps) {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <p className="font-semibold mb-1">{term}</p>
          <p className="text-xs opacity-90 leading-relaxed">{definition}</p>
        </div>
      }
      position="top"
      delayMs={200}
    >
      <span
        className={`cursor-help border-b border-dashed border-primary/50 text-primary font-medium transition-colors hover:border-primary hover:text-primary/80 ${className}`}
      >
        {term}
      </span>
    </Tooltip>
  )
}
