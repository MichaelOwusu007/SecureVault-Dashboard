import { useEffect } from "react";

type ConfirmationModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  title,
  message,
  confirmLabel,
  tone = "warning",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className={`confirmation-modal confirmation-modal--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <div className="modal-signal" aria-hidden="true" />
        <div>
          <p className="eyebrow">{tone === "danger" ? "Permanent action" : "Confirm action"}</p>
          <h2 id="confirmation-modal-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`vault-action-button${tone === "danger" ? " vault-action-button--danger" : ""}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
