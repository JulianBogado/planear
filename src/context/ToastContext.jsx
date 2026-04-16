import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToast({ id, message, type })
    setTimeout(() => setToast(t => t?.id === id ? null : t), 2500)
  }, [])

  const isError = toast?.type === 'error'

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-24 md:bottom-6 left-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-modal text-sm font-semibold w-max max-w-[calc(100vw-2rem)] animate-toast"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: isError ? '#fef2f2' : '#f0fdf4',
            color:           isError ? '#b91c1c' : '#15803d',
            border:          `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
          }}
        >
          {isError ? <XCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-40 hover:opacity-80 transition-opacity shrink-0">
            <X size={13} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}
