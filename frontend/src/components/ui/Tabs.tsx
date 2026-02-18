import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  activeTab: string
  onTabChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  activeTab: "",
  onTabChange: () => {},
})

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue = "", value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)

    const isControlled = controlledValue !== undefined
    const activeTab = isControlled ? controlledValue : internalValue

    const handleTabChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [isControlled, onValueChange]
    )

    return (
      <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex items-center gap-1 rounded-xl bg-secondary p-1",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { activeTab, onTabChange } = React.useContext(TabsContext)
    const isActive = activeTab === value

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-card text-foreground shadow-sm"
            : "text-muted hover:text-foreground",
          className
        )}
        onClick={() => onTabChange(value)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { activeTab } = React.useContext(TabsContext)

    if (activeTab !== value) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={activeTab === value ? "active" : "inactive"}
        className={cn("mt-3 animate-[fade-in_150ms_ease-out]", className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
