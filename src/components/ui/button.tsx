import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // 기본 레이아웃
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors",
    // 포커스 및 접근성 (데스크톱에서만)
    "md:focus-visible:outline-none md:focus-visible:ring-2 md:focus-visible:ring-ring md:focus-visible:ring-offset-2 ring-offset-background",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-button-primary text-white md:hover:bg-button-hover",
        destructive:
          "bg-destructive/10 text-destructive md:hover:bg-destructive md:hover:text-white",
        outline:
          "border border-button-primary text-button-primary md:hover:bg-button-primary/5",
        secondary:
          "bg-button-primary/10 text-button-primary md:hover:bg-button-hover/20",
        ghost: 
          "text-secondary md:hover:bg-button-primary/5",
        link: 
          "text-secondary underline-offset-4 md:hover:underline",
      },
      size: {
        default: "h-14 px-6 text-base",
        secondary: "h-12 px-6 text-base",
        tertiary: "h-10 px-6 text-sm",
        responsive: "h-12 px-6 text-base md:h-10 md:px-6 md:text-sm md:w-auto md:px-4", // pc: tertiary, mobile: secondary
        icon: "h-10 w-10",
      },
      state: {
        default: "",
        loading: "opacity-50 cursor-wait md:hover:bg-brand-lavender md:hover:text-white",
        disabled: "opacity-50 cursor-not-allowed text-text-disabledButton bg-button-disabled md:hover:bg-button-disabled",
      },
      mobile: {
        true: [
                "md:relative md:bottom-auto md:left-auto md:right-auto md:w-auto",
                "fixed left-0 right-0 bottom-0 rounded-none md:static md:rounded-lg"
              ].join(" "),
        false: "",
      },
      icon: {
        false: "gap-2",
        true: "md:hover:[&_svg]:text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
      mobile: false,
      icon: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, state, icon, mobile, asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // disabled 속성이 있지만 state가 지정되지 않은 경우 자동으로 disabled state 적용
    const finalState = state || (disabled ? "disabled" : "default")
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, state: finalState, icon, mobile, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
