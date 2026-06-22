import { FormEvent, useEffect, useState } from "react";
import { SecureVaultNode } from "../../utils/treeUtils";

type RenameNodeModalProps = {
  nodeName: string;
  nodeType: SecureVaultNode["type"];
  onConfirm: (nextName: string) => void;
  onCancel: () => void;
};

export function RenameNodeModal({ nodeName, nodeType, onConfirm, onCancel }: RenameNodeModalProps) {
  const [draftName, setDraftName] = useState(nodeName);
  const trimmedName = draftName.trim();
  const emptyName = trimmedName.length === 0;
  const unchangedName = trimmedName === nodeName;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (emptyName || unchangedName) {
      return;
    }

    onConfirm(trimmedName);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="confirmation-modal rename-node-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-node-modal-title"
      >
        <div className="modal-signal" aria-hidden="true" />
        <div>
          <p className="eyebrow">Rename {nodeType}</p>
          <h2 id="rename-node-modal-title">{nodeName}</h2>
        </div>
        <form className="rename-modal-form" onSubmit={handleSubmit}>
          <label htmlFor="rename-node-input">Name</label>
          <input
            id="rename-node-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            autoFocus
          />
          {emptyName ? (
            <p className="rename-modal-form__error" role="alert">
              Name cannot be empty.
            </p>
          ) : null}
          <div className="modal-actions">
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="vault-action-button" type="submit" disabled={emptyName || unchangedName}>
              Save Name
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
