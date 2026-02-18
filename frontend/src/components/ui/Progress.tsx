import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressTrackVariants = cva(
  "w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      height: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      height: "default",
    },
  }
)

const progressFillVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      color: {
        primary: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        accent: "bg-accent",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
)

interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof progressTrackVariants>,
    VariantProps<typeof progressFillVariants> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, height, color, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(progressTrackVariants({ height }), className)}
        {...props}
      >
        <div
          className={cn(progressFillVariants({ color }))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
export type { ProgressProps }
