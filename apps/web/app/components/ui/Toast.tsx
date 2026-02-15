'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface ToastItem {
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    description?: string
    duration?: number
}

interface ToastContextType {
    showToast: (message: string, type?: ToastItem['type'], description?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const ICONS = {
    success: 'check_circle',
    error: 'cancel',
    info: 'info',
    warning: 'warning',
}

const STYLES = {
    success: {
        border: 'border-[#f4c025]/40',
        icon: 'text-[#f4c025]',
        bar: 'bg-[#f4c025]',
        bg: 'bg-[#0d0b06]',
        title: 'text-[#f4c025]',
        desc: 'text-[#a08a3a]',
    },
    error: {
        border: 'border-red-500/40',
        icon: 'text-red-400',
        bar: 'bg-red-500',
        bg: 'bg-[#0d0606]',
        title: 'text-red-300',
        desc: 'text-red-500/70',
    },
    info: {
        border: 'border-gray-600/40',
        icon: 'text-gray-400',
        bar: 'bg-gray-500',
        bg: 'bg-[#0a0a0a]',
        title: 'text-gray-200',
        desc: 'text-gray-500',
    },
    warning: {
        border: 'border-amber-500/40',
        icon: 'text-amber-400',
        bar: 'bg-amber-500',
        bg: 'bg-[#0d0a04]',
        title: 'text-amber-300',
        desc: 'text-amber-600/70',
    },
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(100)
    const duration = item.duration ?? 5000
    const s = STYLES[item.type]

    useEffect(() => {
        const showTimer = setTimeout(() => setVisible(true), 10)
        const hideTimer = setTimeout(() => {
            setVisible(false)
            setTimeout(onClose, 350)
        }, duration)

        const interval = setInterval(() => {
            setProgress(p => Math.max(0, p - (100 / (duration / 50))))
        }, 50)

        return () => {
            clearTimeout(showTimer)
            clearTimeout(hideTimer)
            clearInterval(interval)
        }
    }, [duration, onClose])

    return (
        <div
            className={`
                relative overflow-hidden rounded-sm border backdrop-blur-md
                shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                w-[320px] cursor-pointer
                transition-all duration-350 ease-out
                ${s.bg} ${s.border}
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-20px]'}
            `}
            onClick={() => { setVisible(false); setTimeout(onClose, 350) }}
        >
            <div className="flex items-start gap-3 px-4 py-3">
                <span className={`material-icons text-[20px] mt-0.5 shrink-0 ${s.icon}`}>
                    {ICONS[item.type]}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={`font-mono text-sm uppercase tracking-widest leading-tight ${s.title}`}>
                        {item.message}
                    </p>
                    {item.description && (
                        <p className={`font-mono text-xs mt-1 leading-relaxed ${s.desc}`}>
                            {item.description}
                        </p>
                    )}
                </div>
                <button
                    onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 350) }}
                    className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
                >
                    <span className="material-icons text-[16px]">close</span>
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/40">
                <div
                    className={`h-full transition-none ${s.bar}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const showToast = useCallback((
        message: string,
        type: ToastItem['type'] = 'info',
        description?: string,
        duration?: number
    ) => {
        const id = crypto.randomUUID()
        setToasts(prev => [...prev, { id, message, type, description, duration }])
    }, [])

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Bottom-left stack */}
            <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 items-start">
                {toasts.map(t => (
                    <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}

// Legacy single-toast export for backwards compat
export function Toast({ message, type = 'info', onClose, duration = 4000 }: {
    message: string
    type?: ToastItem['type']
    onClose: () => void
    duration?: number
}) {
    return <ToastCard item={{ id: 'legacy', message, type, duration }} onClose={onClose} />
}
