import { FolderNode, SecureVaultNode, isFile, isFolder } from "../../utils/treeUtils";

type VaultContextMenuProps = {
  node: SecureVaultNode;
  pathSegments: string[];
  x: number;
  y: number;
  canPaste: boolean;
  onCopyNode: (node: SecureVaultNode, pathSegments: string[]) => void;
  onPasteIntoFolder: (folder: FolderNode, pathSegments: string[]) => void;
  onRequestRename: (node: SecureVaultNode, pathSegments: string[]) => void;
  onCopyPath: (node: SecureVaultNode, pathSegments: string[]) => void;
  onMoveFileToTrash: (node: SecureVaultNode, pathSegments: string[]) => void;
  onDeleteFilePermanently: (node: SecureVaultNode, pathSegments: string[]) => void;
  onSetImportDestination: (folder: FolderNode, pathSegments: string[]) => void;
  onClose: () => void;
};

type ContextMenuAction = {
  label: string;
  disabled?: boolean;
  tone?: "danger";
  onSelect: () => void;
};

function getMenuPosition(x: number, y: number, itemCount: number) {
  const menuWidth = 230;
  const estimatedMenuHeight = 62 + itemCount * 38;
  const safeX = Number.isFinite(x) ? x : 8;
  const safeY = Number.isFinite(y) ? y : 8;
  const viewportWidth = typeof window === "undefined" ? safeX + menuWidth + 8 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? safeY + estimatedMenuHeight + 8 : window.innerHeight;

  return {
    left: Math.max(8, Math.min(safeX, viewportWidth - menuWidth - 8)),
    top: Math.max(8, Math.min(safeY, viewportHeight - estimatedMenuHeight - 8)),
  };
}

export function VaultContextMenu({
  node,
  pathSegments,
  x,
  y,
  canPaste,
  onCopyNode,
  onPasteIntoFolder,
  onRequestRename,
  onCopyPath,
  onMoveFileToTrash,
  onDeleteFilePermanently,
  onSetImportDestination,
  onClose,
}: VaultContextMenuProps) {
  const folder = isFolder(node) ? node : null;
  const actions: ContextMenuAction[] = isFile(node)
    ? [
        {
          label: "Copy",
          onSelect: () => onCopyNode(node, pathSegments),
        },
        {
          label: "Rename",
          onSelect: () => onRequestRename(node, pathSegments),
        },
        {
          label: "Copy Path",
          onSelect: () => onCopyPath(node, pathSegments),
        },
        {
          label: "Move to Trash",
          onSelect: () => onMoveFileToTrash(node, pathSegments),
        },
        {
          label: "Delete Permanently",
          tone: "danger",
          onSelect: () => onDeleteFilePermanently(node, pathSegments),
        },
      ]
    : [
        {
          label: "Copy Folder",
          onSelect: () => onCopyNode(node, pathSegments),
        },
        {
          label: "Paste Here",
          disabled: !canPaste || !folder,
          onSelect: () => {
            if (folder) {
              onPasteIntoFolder(folder, pathSegments);
            }
          },
        },
        {
          label: "Rename Folder",
          onSelect: () => onRequestRename(node, pathSegments),
        },
        {
          label: "Copy Path",
          onSelect: () => onCopyPath(node, pathSegments),
        },
        {
          label: "Set as Import Destination",
          disabled: !folder,
          onSelect: () => {
            if (folder) {
              onSetImportDestination(folder, pathSegments);
            }
          },
        },
      ];
  const menuPosition = getMenuPosition(x, y, actions.length);

  return (
    <div
      className="vault-context-menu"
      style={menuPosition}
      role="menu"
      aria-label={`${node.name} context actions`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="vault-context-menu__target">
        <span>{folder ? "Folder" : "File"}</span>
        <strong title={node.name}>{node.name}</strong>
      </div>
      <div className="vault-context-menu__actions">
        {actions.map((action) => (
          <button
            className={action.tone === "danger" ? "is-danger" : undefined}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            key={action.label}
            onClick={() => {
              if (action.disabled) {
                return;
              }

              action.onSelect();
              onClose();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
