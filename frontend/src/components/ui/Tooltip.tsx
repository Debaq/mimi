import * as React from "react"
import { cn } from "@/lib/utils"

type TooltipPosition = "top" | "bottom" | "left" | "right"

interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode
  position?: TooltipPosition
  delayMs?: number
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, position = "top", delayMs = 300, children, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const showTooltip = React.useCallback(() => {
      timeoutRef.current = setTimeout(() => {
        setVisible(true)
      }, delayMs)
    }, [delayMs])

    const hideTooltip = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setVisible(false)
    }, [])

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        {...props}
      >
        {children}
        {visible && (
          <div
            role="tooltip"
            className={cn(
              "absolute z-50 max-w-xs rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-lg",
              "animate-[fade-in_100ms_ease-out]",
              "pointer-events-none select-none",
              positionClasses[position]
            )}
          >
            {content}
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"

export { Tooltip }
export type { TooltipProps, TooltipPosition }
