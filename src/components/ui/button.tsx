import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibe-purple/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden group",
  {
    variants: {
      variant: {
        // Primary gradient button with glow effect
        default: [
          "bg-gradient-to-r from-vibe-purple via-vibe-blue to-vibe-purple bg-size-200 bg-pos-0",
          "text-white font-semibold shadow-lg shadow-vibe-purple/25",
          "border border-white/20 backdrop-blur-sm",
          "hover:bg-pos-100 hover:shadow-xl hover:shadow-vibe-purple/40 hover:scale-[1.02]",
          "active:scale-[0.98] active:shadow-lg",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
          "before:translate-x-[-100%] before:transition-transform before:duration-700",
          "hover:before:translate-x-[100%]"
        ],
        
        // Glass morphism button
        glass: [
          "bg-white/5 backdrop-blur-xl border border-white/20",
          "text-white/90 font-medium",
          "shadow-lg shadow-black/20",
          "hover:bg-white/10 hover:border-white/30 hover:text-white",
          "hover:shadow-xl hover:shadow-vibe-purple/20 hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Neon outline button
        outline: [
          "bg-transparent border-2 border-vibe-purple/50",
          "text-vibe-purple font-semibold",
          "shadow-lg shadow-vibe-purple/10",
          "hover:bg-vibe-purple/10 hover:border-vibe-purple hover:text-white",
          "hover:shadow-xl hover:shadow-vibe-purple/30 hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Subtle ghost button
        ghost: [
          "bg-transparent text-white/70",
          "hover:bg-white/10 hover:text-white hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Destructive button with red theme
        destructive: [
          "bg-gradient-to-r from-red-500 to-red-600",
          "text-white font-semibold shadow-lg shadow-red-500/25",
          "border border-red-400/20",
          "hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Success button with green theme
        success: [
          "bg-gradient-to-r from-emerald-500 to-emerald-600",
          "text-white font-semibold shadow-lg shadow-emerald-500/25",
          "border border-emerald-400/20",
          "hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Premium button with gold accents
        premium: [
          "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-size-200 bg-pos-0",
          "text-black font-bold shadow-lg shadow-amber-500/30",
          "border border-amber-300/30",
          "hover:bg-pos-100 hover:shadow-xl hover:shadow-amber-500/50 hover:scale-[1.02]",
          "active:scale-[0.98]"
        ],
        
        // Link style
        link: "text-vibe-purple underline-offset-4 hover:underline hover:text-vibe-blue transition-colors",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        default: "h-10 px-4 py-2 text-sm rounded-xl",
        lg: "h-12 px-6 py-3 text-base rounded-xl",
        xl: "h-14 px-8 py-4 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
