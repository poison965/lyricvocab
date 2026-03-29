'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none md:bottom-8 md:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md border animate-toast-in cursor-pointer",
            "text-sm font-semibold transition-all",
            toast.type === 'success' && "bg-[#1a1a1a]/95 border-[#72fe8f]/20 text-white",
            toast.type === 'error' && "bg-[#1a1a1a]/95 border-[#ff7351]/20 text-white",
            toast.type === 'info' && "bg-[#1a1a1a]/95 border-[#88ebff]/20 text-white"
          )}
          onClick={() => dismissToast(toast.id)}
        >
          <span className={cn(
            "material-symbols-outlined text-lg shrink-0",
            toast.type === 'success' && "text-[#72fe8f]",
            toast.type === 'error' && "text-[#ff7351]",
            toast.type === 'info' && "text-[#88ebff]"
          )}>
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  )
}