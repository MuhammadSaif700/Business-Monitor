import React, { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((opts) => {
    const id = Date.now() + Math.random()
    const t = {
      id,
      type: opts?.type || 'info',
      message: typeof opts === 'string' ? opts : opts?.message || '',
      duration: opts?.duration || 3500,
    }
    setToasts((prev) => [...prev, t])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'max-w-sm rounded shadow px-4 py-3 text-sm bg-white border ' +
              (t.type === 'success'
                ? 'border-green-300'
                : t.type === 'error'
                ? 'border-red-300'
                : 'border-gray-200')
            }
            role="status"
            aria-live="polite"
          >
            <div className="font-medium mb-1">
              {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : 'Notice'}
            </div>
            <div className="text-gray-800">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
