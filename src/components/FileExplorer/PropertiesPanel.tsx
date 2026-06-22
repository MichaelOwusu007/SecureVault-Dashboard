import { FormEvent, useEffect, useState } from "react";
import {
  SecureVaultNode,
  formatFullPath,
  getFileKind,
  isFile,
  isFolder,
} from "../../utils/treeUtils";

type PropertiesPanelProps = {
  selectedNode: SecureVaultNode | null;
  pathSegments: string[];
  onRenameNode: (nodeId: string, nextName: string) => void;
  onMoveToTrash: () => void;
  onDeletePermanently: () => void;
};

export function PropertiesPanel({
  selectedNode,
  pathSegments,
  onRenameNode,
  onMoveToTrash,
  onDeletePermanently,
}: PropertiesPanelProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    setIsRenaming(false);
    setDraftName(selectedNode?.name ?? "");
  }, [selectedNode?.id, selectedNode?.name]);

  if (!selectedNode) {
    return (
      <aside className="properties-panel" aria-label="Vault properties">
        <div className="panel-heading">
          <div className="panel-heading__title">
            <p className="eyebrow">Properties</p>
            <h2>Awaiting selection</h2>
          </div>
        </div>
        <div className="selection-placeholder">
          <div className="placeholder-file" aria-hidden="true" />
          <p>Select a file for metadata and actions, or select a folder as the import destination.</p>
        </div>
      </aside>
    );
  }

  const fullPath = formatFullPath(pathSegments);
  const selectedFile = isFile(selectedNode) ? selectedNode : null;
  const selectedFolder = isFolder(selectedNode) ? selectedNode : null;
  const selectedNodeKind = selectedFolder ? "folder" : "file";
  const fileKind = selectedFile ? getFileKind(selectedFile.name, selectedFile.mimeType) : null;

  const handleRenameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextName = draftName.trim();

    if (!nextName || nextName === selectedNode.name) {
      setIsRenaming(false);
      setDraftName(selectedNode.name);
      return;
    }

    onRenameNode(selectedNode.id, nextName);
    setIsRenaming(false);
  };

  return (
    <aside
      className="properties-panel"
      aria-label={`${selectedNode.name} ${selectedFolder ? "folder" : "file"} properties`}
    >
      <div className="panel-heading">
        <div className="panel-heading__title">
          <p className="eyebrow">{selectedFolder ? "Folder destination" : "Properties"}</p>
          <h2>{selectedNode.name}</h2>
        </div>
        {selectedFile ? (
          <div className="panel-heading__actions" aria-label="File actions">
            <button className="panel-action-button" type="button" onClick={onMoveToTrash}>
              Trash
            </button>
            <button
              className="panel-action-button panel-action-button--danger"
              type="button"
              onClick={onDeletePermanently}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <dl className="metadata-list">
        <div>
          <dt>Name</dt>
          <dd>{selectedNode.name}</dd>
        </div>
        <div>
          <dt>Item type</dt>
          <dd>{selectedFolder ? "Folder" : "File"}</dd>
        </div>
        {selectedFile ? (
          <>
            <div>
              <dt>File kind</dt>
              <dd>{fileKind}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{selectedFile.size}</dd>
            </div>
          </>
        ) : null}
        {selectedFolder ? (
          <div>
            <dt>Child items</dt>
            <dd>{selectedFolder.children.length}</dd>
          </div>
        ) : null}
        <div>
          <dt>Internal path</dt>
          <dd className="path-value">{fullPath}</dd>
        </div>
      </dl>

      <div className="file-action-stack" aria-label={`${selectedNodeKind} actions`}>
        <div className="rename-card">
          <div>
            <p className="action-title">Edit {selectedNodeKind} name</p>
            <p className="action-note">Updates the frontend vault tree and internal path.</p>
          </div>
          {isRenaming ? (
            <form className="rename-form" onSubmit={handleRenameSubmit}>
              <label className="sr-only" htmlFor="rename-node-inline-input">
                New {selectedNodeKind} name
              </label>
              <input
                id="rename-node-inline-input"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                autoFocus
              />
              <div className="rename-actions">
                <button type="submit">Save</button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setIsRenaming(false);
                    setDraftName(selectedNode.name);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
        ) : (
          <button className="secondary-action" type="button" onClick={() => setIsRenaming(true)}>
            Rename {selectedNodeKind}
          </button>
        )}
      </div>
      </div>
    </aside>
  );
}
