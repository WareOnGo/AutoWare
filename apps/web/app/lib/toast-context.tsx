import * as React from "react"
import { ToastContainer, type ToastProps } from "~/components/ui/toast"

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = React.useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substring(2, 9)
      const duration = toast.duration ?? 5000

      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: removeToast,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const showSuccess = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, variant: "success" })
    },
    [showToast]
  )

  const showError = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, variant: "error", duration: 7000 })
    },
    [showToast]
  )

  const showWarning = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, variant: "warning" })
    },
    [showToast]
  )

  const value = React.useMemo(
    () => ({ showToast, showSuccess, showError, showWarning }),
    [showToast, showSuccess, showError, showWarning]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
