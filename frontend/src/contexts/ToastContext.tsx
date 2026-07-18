import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X, RotateCcw } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onUndo?: () => void;
}

interface ToastContextType {
  toast: (message: string, type: Toast['type'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  successWithUndo: (message: string, onUndo: () => void, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...t }]);
    if (t.duration !== 0) {
      setTimeout(() => removeToast(id), t.duration ?? 4000);
    }
  }, [removeToast]);

  const toast = useCallback((message: string, type: Toast['type'], duration = 4000) => {
    addToast({ message, type, duration });
  }, [addToast]);

  const success = useCallback((msg: string, dur?: number) => toast(msg, 'success', dur), [toast]);
  const error = useCallback((msg: string, dur?: number) => toast(msg, 'error', dur), [toast]);
  const warning = useCallback((msg: string, dur?: number) => toast(msg, 'warning', dur), [toast]);
  const info = useCallback((msg: string, dur?: number) => toast(msg, 'info', dur), [toast]);

  const successWithUndo = useCallback((message: string, onUndo: () => void, duration = 6000) => {
    addToast({ message, type: 'success', duration, onUndo });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, successWithUndo }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }[t.type];
            const colors = {
              success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-300 shadow-emerald-950/20',
              error: 'border-rose-500/30 bg-rose-950/80 text-rose-300 shadow-rose-950/20',
              warning: 'border-amber-500/30 bg-amber-950/80 text-amber-300 shadow-amber-950/20',
              info: 'border-indigo-500/30 bg-indigo-950/80 text-indigo-300 shadow-indigo-950/20',
            }[t.type];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl pointer-events-auto ${colors}`}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm font-medium">{t.message}</div>
                {t.onUndo && (
                  <button
                    onClick={() => { t.onUndo?.(); removeToast(t.id); }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo
                  </button>
                )}
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-white/40 hover:text-white/90 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
