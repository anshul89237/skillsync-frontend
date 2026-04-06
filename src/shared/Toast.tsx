import React, { useEffect, useState } from 'react';
import { LucideCheckCircle, LucideAlertCircle, LucideInfo, LucideX } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <LucideCheckCircle size={18} />,
    error: <LucideAlertCircle size={18} />,
    info: <LucideInfo size={18} />,
    warning: <LucideAlertCircle size={18} />,
  };

  const tone = {
    success: 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]',
    error: 'border-[#e6495d]/40 bg-[#e6495d]/10 text-[#e6495d]',
    info: 'border-[#3c82f7]/40 bg-[#3c82f7]/10 text-[#3c82f7]',
    warning: 'border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]',
  }[type];

  return (
    <div className="glass-panel flex w-full items-center gap-3 border p-3 shadow-lg transition-all duration-300">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${tone}`}>{icons[type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#1f2543]">{message}</p>
      </div>
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#8f96b2] transition hover:bg-[#f2f4fb] hover:text-[#1f2543]" onClick={onClose}>
        <LucideX size={14} />
      </button>
    </div>
  );
};

// Singleton-like manager for programmatically showing toasts
let toastFn: (msg: string, type?: ToastType) => void = () => {};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  useEffect(() => {
    toastFn = (message: string, type: ToastType = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
};

export const toast = (message: string, type: ToastType = 'info') => {
  toastFn(message, type);
};
