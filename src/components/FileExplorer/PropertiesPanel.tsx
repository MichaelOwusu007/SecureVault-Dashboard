import { FileNode, formatFullPath } from "../../utils/treeUtils";

type PropertiesPanelProps = {
  selectedFile: FileNode | null;
  pathSegments: string[];
};

export function PropertiesPanel({ selectedFile, pathSegments }: PropertiesPanelProps) {
  if (!selectedFile) {
    return (
      <aside className="properties-panel" aria-label="File properties">
        <div className="panel-heading">
          <p className="eyebrow">Properties</p>
          <h2>Awaiting file selection</h2>
        </div>
        <div className="selection-placeholder">
          <div className="placeholder-file" aria-hidden="true" />
          <p>Select a file in the explorer to inspect metadata, verify size, and copy the exact vault path.</p>
        </div>
      </aside>
    );
  }

  const fullPath = formatFullPath(pathSegments);

  return (
    <aside className="properties-panel" aria-label={`${selectedFile.name} properties`}>
      <div className="panel-heading">
        <p className="eyebrow">Properties</p>
        <h2>{selectedFile.name}</h2>
      </div>

      <dl className="metadata-list">
        <div>
          <dt>Name</dt>
          <dd>{selectedFile.name}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{selectedFile.type}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{selectedFile.size}</dd>
        </div>
        <div>
          <dt>Full path</dt>
          <dd className="path-value">{fullPath}</dd>
        </div>
      </dl>
    </aside>
  );
}
