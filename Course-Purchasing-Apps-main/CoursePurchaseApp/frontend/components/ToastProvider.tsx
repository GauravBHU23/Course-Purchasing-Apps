"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextValue = {
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const defaultTitles: Record<ToastType, string> = {
  success: "Success",
  error: "Something went wrong",
  info: "Heads up"
};

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Date.now() + Math.random();
      const duration = type === "error" ? 5200 : 4200;
      setToasts((current) =>
        [...current, { id, message, type, title: title ?? defaultTitles[type], duration }].slice(-4)
      );
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      error: (message: string, title?: string) => showToast("error", message, title),
      success: (message: string, title?: string) => showToast("success", message, title),
      info: (message: string, title?: string) => showToast("info", message, title)
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="toast-region">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div className={`toast toast-${toast.type}`} key={toast.id} role="status">
              <span className="toast-icon">
                <Icon size={20} />
              </span>
              <div className="toast-body">
                <strong className="toast-title">{toast.title}</strong>
                <p>{toast.message}</p>
              </div>
              <button aria-label="Dismiss" className="toast-close" onClick={() => removeToast(toast.id)} type="button">
                <X size={16} />
              </button>
              <span
                className="toast-progress"
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
