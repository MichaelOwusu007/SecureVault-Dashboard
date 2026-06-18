export type ToastMessage = {
  id: string;
  message: string;
  action?: {
    label: string;
    type: "restore-trash";
    trashId: string;
  };
};

type ToastContainerProps = {
  toasts: ToastMessage[];
  onDismiss: (toastId: string) => void;
  onAction: (toast: ToastMessage) => void;
};

export function ToastContainer({ toasts, onDismiss, onAction }: ToastContainerProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-label="Vault notifications">
      {toasts.map((toast) => (
        <div className="toast-card" key={toast.id}>
          <span>{toast.message}</span>
          <div className="toast-actions">
            {toast.action ? (
              <button type="button" onClick={() => onAction(toast)}>
                {toast.action.label}
              </button>
            ) : null}
            <button type="button" aria-label={`Dismiss ${toast.message}`} onClick={() => onDismiss(toast.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
