import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border bg-card px-4 py-2 pr-10 text-sm text-foreground transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-destructive focus-visible:ring-destructive"
              : "border-border",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    )
  }
)
Select.displayName = "Select"

interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectOption = React.forwardRef<HTMLOptionElement, SelectOptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={cn("text-foreground", className)}
        {...props}
      />
    )
  }
)
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }
export type { SelectProps, SelectOptionProps }
