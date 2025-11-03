"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ToastContextValue {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
}

interface ToastData {
  id: string
  title: string
  description?: string
  variant?: "default" | "success" | "destructive" | "warning"
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const addToast = React.useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 w-full md:max-w-[420px] md:bottom-4 md:right-4 md:w-full p-4">
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <Toast key={toast.id} data={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context.addToast
}

function Toast({ data, onRemove }: { data: ToastData; onRemove: (id: string) => void }) {
  return (
    <div
      className={cn(
        "group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-gray-200 p-6 pr-8 shadow-lg transition-all",
        data.variant === "destructive" && "bg-red-50 border-red-200",
        data.variant === "success" && "bg-green-50 border-green-200",
        data.variant === "warning" && "bg-yellow-50 border-yellow-200",
        !data.variant && "bg-white"
      )}
    >
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{data.title}</div>
        {data.description && (
          <div className="text-sm opacity-90">{data.description}</div>
        )}
      </div>
      <button
        className="absolute right-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        onClick={() => onRemove(data.id)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

