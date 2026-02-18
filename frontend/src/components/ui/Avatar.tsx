import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-14 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", fallback, size, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    React.useEffect(() => {
      setImageError(false)
    }, [src])

    const showImage = src && !imageError

    const initials = React.useMemo(() => {
      if (fallback) return fallback
      if (!alt) return "?"
      return alt
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    }, [alt, fallback])

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-medium text-muted select-none">
            {initials}
          </span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }
export type { AvatarProps }
