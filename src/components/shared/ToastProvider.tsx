import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

const ICONS: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-bronze-text/60 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info', durationMs: number = DEFAULT_DURATION_MS) => {
            const id = nextId.current++;
            setToasts((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), { id, message, type }]);
            window.setTimeout(() => dismiss(id), durationMs);
        },
        [dismiss]
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                aria-live="polite"
                className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
            >
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            role={toast.type === 'error' ? 'alert' : 'status'}
                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-start gap-2.5 bg-cream border border-cream-dark rounded-xl shadow-lg px-4 py-3"
                        >
                            {ICONS[toast.type]}
                            <p className="text-sm text-bronze-text flex-1 break-words">{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => dismiss(toast.id)}
                                aria-label="Dismiss"
                                className="text-bronze-text/40 hover:text-bronze-text transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
