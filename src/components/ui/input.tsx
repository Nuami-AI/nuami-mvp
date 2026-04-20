import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-normal bg-white px-4 pt-2 pb-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-disabled focus-visible:outline-none focus-visible:border focus-visible:border-brand-lavender focus-visible:ring-brand-lavender disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-form-disabled/25 focus:shadow-lg focus:shadow-brand-lavender/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }


// import * as React from "react"
// import { cva, type VariantProps } from "class-variance-authority"

// import { cn } from "@/lib/utils"

// const inputVariants = cva(
//   [
//     // 기본 레이아웃
//     "flex w-full rounded-lg border border-normal bg-white px-4 pt-6 pb-2 text-base",
//     // 포커스 및 접근성
//     "ring-offset-background focus-visible:outline-none focus-visible:border focus-visible:border-brand-lavender focus-visible:ring-brand-lavender",
//     // 파일 업로드 스타일
//     "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
//     // 플레이스홀더
//     "placeholder:text-disabled",
//     // 포커스 효과
//     "focus:shadow-lg focus:shadow-brand-lavender/20",
//   ].join(" "),
//   {
//     variants: {
//       size: {
//         default: "h-10",
//         sm: "h-8 text-sm",
//         lg: "h-12 text-base",
//         xl: "h-14 text-lg",
//       },
//       state: {
//         default: "",
//         error: "border-danger focus-visible:border-danger focus-visible:ring-danger focus-visible:ring-1 bg-danger/5 focus-visible:bg-danger/5",
//         success: "border-success focus-visible:border-success focus-visible:ring-success focus-visible:ring-1 bg-success/5 focus-visible:bg-success/5",
//         disabled: "cursor-not-allowed opacity-50 bg-form-disabled/25",
//       },
//       variant: {
//         default: "bg-white",
//         filled: "bg-gray-50",
//         transparent: "bg-transparent",
//       },
//     },
//     defaultVariants: {
//       size: "default",
//       state: "default",
//       variant: "default",
//     },
//   }
// )

// export interface InputProps
//   extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
//     VariantProps<typeof inputVariants> {}

// const Input = React.forwardRef<HTMLInputElement, InputProps>(
//   ({ className, type, size, state, variant, ...props }, ref) => {
//     return (
//       <input
//         type={type}
//         className={cn(inputVariants({ size, state, variant, className }))}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Input.displayName = "Input"

// export { Input, inputVariants }
