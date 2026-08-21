import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info'

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
  durationMs?: number
}

interface ToastItem extends ToastInput {
  id: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneIcon: Record<ToastTone, ReactNode> = {
  neutral: <Info size={18} className="text-ink-secondary" />,
  success: <CheckCircle2 size={18} className="text-success" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  critical: <XCircle size={18} className="text-critical" />,
  info: <Info size={18} className="text-info" />,
}

const toneBorder: Record<ToastTone, string> = {
  neutral: 'border-border',
  success: 'border-success-border',
  warning: 'border-warning-border',
  critical: 'border-critical-border',
  info: 'border-info-border',
}

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++idCounter
      setItems((prev) => [...prev, { ...input, id }])
      const duration = input.durationMs ?? 4000
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface p-3.5 shadow-lg sm:w-96',
                  toneBorder[item.tone ?? 'neutral']
                )}
              >
                <span className="mt-0.5 shrink-0">{toneIcon[item.tone ?? 'neutral']}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-[12px] text-ink-secondary">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded-sm p-0.5 text-ink-tertiary hover:bg-surface-sunken hover:text-ink"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
