import { useEffect, useState } from 'react'

interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  className?: string
}

export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = 'var(--color-primary, #6366f1)',
  trackColor = 'var(--color-secondary, #f1f5f9)',
  className = '',
}: ProgressRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  useEffect(() => {
    // Animar al montar
    const timer = setTimeout(() => {
      setAnimatedPercentage(Math.min(100, Math.max(0, percentage)))
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {/* Texto central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-foreground">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}
