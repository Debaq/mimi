import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98]",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary active:scale-[0.98]",
        ghost:
          "text-foreground hover:bg-secondary active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        default: "h-10 rounded-xl px-5 text-sm",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonElement = React.ElementRef<"button">

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props,
      })
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
