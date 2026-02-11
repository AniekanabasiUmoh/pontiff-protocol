'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { id, message, type };

        setToasts((prev) => [...prev, toast]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-lg flex items-center justify-between animate-slide-up backdrop-blur-md border 
                            ${toast.type === 'success' ? 'bg-green-900/80 border-green-500 text-green-100' :
                                toast.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' :
                                    'bg-neutral-800/80 border-neutral-600 text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            <span className="font-medium text-sm">{toast.message}</span>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 text-white/50 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
