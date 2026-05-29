"use client";

import { ReactNode, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ModalTone = "error" | "success" | "info";

type Action = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type Props = {
  open: boolean;
  tone?: ModalTone;
  title: string;
  message: ReactNode;
  actions?: Action[];
  onClose?: () => void;
  dismissable?: boolean;
};

const toneIcon = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info
};

export function Modal({
  open,
  tone = "info",
  title,
  message,
  actions = [],
  onClose,
  dismissable = true
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissable && onClose) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  const Icon = toneIcon[tone];

  return (
    <div
      className="modal-overlay"
      onClick={() => dismissable && onClose?.()}
      role="presentation"
    >
      <div
        aria-modal="true"
        className={`modal modal-${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        {dismissable && onClose ? (
          <button aria-label="Close" className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        ) : null}
        <span className="modal-icon">
          <Icon size={28} />
        </span>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-message">{message}</div>
        {actions.length > 0 ? (
          <div className="modal-actions">
            {actions.map((action) => (
              <button
                className={`button ${action.variant === "secondary" ? "secondary" : ""}`}
                key={action.label}
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
