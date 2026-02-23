import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  timeout: number;
}

interface ToastContextType {
  success: (message: string, timeout?: number) => void;
  error: (message: string, timeout?: number) => void;
  info: (message: string, timeout?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: Toast['variant'], timeout = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, variant, timeout };
    
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      removeToast(id);
    }, timeout);
  }, [removeToast]);

  const success = useCallback((message: string, timeout?: number) => {
    addToast(message, 'success', timeout);
  }, [addToast]);

  const error = useCallback((message: string, timeout?: number) => {
    addToast(message, 'error', timeout);
  }, [addToast]);

  const info = useCallback((message: string, timeout?: number) => {
    addToast(message, 'info', timeout);
  }, [addToast]);

  const getIcon = (variant: Toast['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
    }
  };

  const getStyles = (variant: Toast['variant']) => {
    switch (variant) {
      case 'success':
        return 'border-green-600 bg-green-50 text-green-900';
      case 'error':
        return 'border-red-600 bg-red-50 text-red-900';
      case 'info':
        return 'border-blue-600 bg-blue-50 text-blue-900';
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              flex items-start gap-3
              px-4 py-3
              rounded-lg border-l-4
              shadow-lg
              font-mono text-sm
              max-w-md
              animate-slide-in
              ${getStyles(toast.variant)}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.variant)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
