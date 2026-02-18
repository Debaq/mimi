import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
})

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  children: React.ReactNode
}

function Dialog({ open: controlledOpen, onOpenChange, defaultOpen = false, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value)
      }
      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onOpenChange(true)
          onClick?.(e)
        }}
        {...props}
      />
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext)

    React.useEffect(() => {
      if (!open) return

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false)
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.body.style.overflow = ""
      }
    }, [open, onOpenChange])

    if (!open) return null

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm animate-[fade-in_150ms_ease-out]"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        {/* Content */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl",
            "animate-[dialog-in_200ms_ease-out]",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onOpenChange(false)
          onClick?.(e)
        }}
        {...props}
      />
    )
  }
)
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
