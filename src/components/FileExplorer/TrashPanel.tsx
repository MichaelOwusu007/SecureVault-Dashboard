import {
  TrashedFileItem,
  formatDisplayDate,
  formatFullPath,
  getFileKind,
  getNodeIconMeta,
} from "../../utils/treeUtils";

type TrashPanelProps = {
  items: TrashedFileItem[];
  onRestore: (trashId: string) => void;
  onDeletePermanently: (trashId: string) => void;
};

export function TrashPanel({ items, onRestore, onDeletePermanently }: TrashPanelProps) {
  return (
    <aside className="trash-panel" aria-label="Trash">
      <div className="trash-panel__header">
        <div>
          <p className="eyebrow">Trash</p>
          <h2>Recoverable files</h2>
        </div>
        <span className="trash-count">{items.length}</span>
      </div>

      {items.length ? (
        <div className="trash-list">
          {items.map((item) => {
            const iconMeta = getNodeIconMeta(item.file);
            const fileKind = getFileKind(item.file.name, item.file.mimeType);

            return (
              <article className="trash-item" key={item.id}>
                <div className="trash-item__topline">
                  <strong>{item.file.name}</strong>
                  <span title={fileKind}>{iconMeta.label}</span>
                </div>
                <dl>
                  <div>
                    <dt>File kind</dt>
                    <dd>{fileKind}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{item.file.size}</dd>
                  </div>
                  <div>
                    <dt>Original path</dt>
                    <dd>{formatFullPath(item.originalPathSegments)}</dd>
                  </div>
                  <div>
                    <dt>Moved</dt>
                    <dd>{formatDisplayDate(item.trashedAt)}</dd>
                  </div>
                </dl>
                <div className="trash-item__actions">
                  <button type="button" onClick={() => onRestore(item.id)}>
                    Restore
                  </button>
                  <button type="button" className="danger-text-button" onClick={() => onDeletePermanently(item.id)}>
                    Delete permanently
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="trash-empty">No files in Trash.</p>
      )}
    </aside>
  );
}
