'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: number
    type: ToastType
    title: string
    message: string
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Date.now()
        setToasts((prev) => [...prev, { ...toast, id }])

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            removeToast(id)
        }, 5000)
    }

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
                {toasts.map((toast) => (
                    <ToastComponent key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// Toast Component
import { motion, AnimatePresence } from 'framer-motion'

interface ToastComponentProps extends Toast {
    onClose: () => void
}

function ToastComponent({ type, title, message, onClose }: ToastComponentProps) {
    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    border: 'border-[#00ff00]',
                    icon: '✓',
                    iconColor: 'text-[#00ff00]',
                }
            case 'error':
                return {
                    border: 'border-red-500',
                    icon: '✕',
                    iconColor: 'text-red-500',
                }
            case 'warning':
                return {
                    border: 'border-yellow-500',
                    icon: '⚠',
                    iconColor: 'text-yellow-500',
                }
            case 'info':
                return {
                    border: 'border-[#8B0000]',
                    icon: 'ℹ',
                    iconColor: 'text-[#8B0000]',
                }
        }
    }

    const styles = getStyles()

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`bg-[#1a1a1a] border-2 ${styles.border} rounded-lg p-4 shadow-[0_0_20px_rgba(139,0,0,0.3)] min-w-[300px]`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`text-2xl ${styles.iconColor} flex-shrink-0`}>{styles.icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-cinzel font-bold text-[#e0e0e0] mb-1">{title}</p>
                    <p className="text-sm text-[#e0e0e0]/70 font-inter">{message}</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="text-[#e0e0e0]/50 hover:text-[#e0e0e0] transition-colors flex-shrink-0 text-xl leading-none"
                >
                    ×
                </button>
            </div>
        </motion.div>
    )
}
