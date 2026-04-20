"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import SuccessIcon from "@/public/svg/ico_success.svg"
import ErrorIcon from "@/public/svg/ico_error.svg"
import WarningIcon from "@/public/svg/ico_warning.svg"

export function Toaster() {
  const { toasts } = useToast()

  const getIconComponent = (iconType?: 'success' | 'error' | 'warning') => {
    switch (iconType) {
      case 'success':
        return <SuccessIcon width={24} height={24} />
      case 'error':
        return <ErrorIcon width={24} height={24} />
      case 'warning':
        return <WarningIcon width={24} height={24} />
      default:
        return null
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, iconType, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-0 items-center">
              {/* 24px 아이콘 */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {getIconComponent(iconType)}
              </div>
              
              {/* 타이틀과 본문 */}
              <div className="flex-1 min-w-0">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
              </div>
            </div>
            {action}
            {/* <ToastClose /> */}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
