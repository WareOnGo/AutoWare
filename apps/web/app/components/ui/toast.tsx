import * as React from "react"
import { X } from "lucide-react"
import { cn } from "~/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  const variantStyles = {
    default: "bg-white border-gray-200",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  }

  const iconStyles = {
    default: "text-gray-600",
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
  }

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        variantStyles[variant]
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && (
              <p className={cn("text-sm font-semibold", iconStyles[variant])}>
                {title}
              </p>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={() => onClose(id)}
            className={cn(
              "ml-4 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
              iconStyles[variant],
              "hover:bg-gray-100"
            )}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: ToastProps[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-4 p-6 sm:p-6"
      style={{ top: "auto", bottom: 0 }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
