import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground transition-colors duration-200",
          "placeholder:text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
export type { TextareaProps }
