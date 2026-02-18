import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

let addToastFn: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(type: ToastMessage['type'], message: string) {
  if (addToastFn) {
    addToastFn({ type, message })
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => {
      addToastFn = null
    }
  }, [addToast])

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 4000)
    return () => clearTimeout(timer)
  }, [toasts])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm animate-[slide-up_200ms_ease-out] ${
            t.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : t.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-primary/30 bg-primary/10 text-primary'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="size-5 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="size-5 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="size-5 shrink-0 mt-0.5" />}
          <p className="text-sm flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
