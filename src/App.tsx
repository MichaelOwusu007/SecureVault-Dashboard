import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import vaultData from "./data/data.json";
import { BreadcrumbBar } from "./components/FileExplorer/BreadcrumbBar";
import { ConfirmationModal } from "./components/FileExplorer/ConfirmationModal";
import { FileExplorer } from "./components/FileExplorer/FileExplorer";
import { PropertiesPanel } from "./components/FileExplorer/PropertiesPanel";
import { ToastContainer, ToastMessage } from "./components/FileExplorer/ToastContainer";
import { TrashPanel } from "./components/FileExplorer/TrashPanel";
import {
  FileNode,
  SecureVaultNode,
  TrashedFileItem,
  addNodeToFolder,
  countNodes,
  findNodePath,
  formatFullPath,
  formatStorage,
  getUniqueNodeName,
  isFile,
  isFolder,
  removeFileById,
  renameFileById,
} from "./utils/treeUtils";

const initialNodes = vaultData as SecureVaultNode[];

type SelectedNodeState = {
  node: SecureVaultNode;
  pathSegments: string[];
};

type PendingConfirmation =
  | { type: "move-to-trash"; fileId: string }
  | { type: "delete-vault-file"; fileId: string }
  | { type: "delete-trash-file"; trashId: string };

type ThemeMode = "dark" | "light";
const THEME_STORAGE_KEY = "securevault-theme-mode";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : "dark";
  } catch {
    return "dark";
  }
}

export default function App() {
  const [vaultNodes, setVaultNodes] = useState<SecureVaultNode[]>(() => initialNodes);
  const [selectedItem, setSelectedItem] = useState<SelectedNodeState | null>(null);
  const [pathCopied, setPathCopied] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashedFileItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedNode = selectedItem?.node ?? null;
  const selectedPathSegments = selectedItem?.pathSegments ?? [];
  const selectedFile = selectedNode && isFile(selectedNode) ? selectedNode : null;
  const selectedFolder = selectedNode && isFolder(selectedNode) ? selectedNode : null;
  const vaultCounts = useMemo(() => countNodes(vaultNodes), [vaultNodes]);
  const summaryCards = useMemo(
    () => [
      {
        label: "Total files",
        value: vaultCounts.files.toString(),
        detail: "Indexed vault records",
        tone: "emerald",
      },
      {
        label: "Total folders",
        value: vaultCounts.folders.toString(),
        detail: "Nested access groups",
        tone: "amber",
      },
      {
        label: "Storage used",
        value: formatStorage(vaultCounts.storageBytes),
        detail: "Across visible dataset",
        tone: "blue",
      },
      {
        label: "File types",
        value: vaultCounts.fileTypes.size.toString(),
        detail: "Detected extensions",
        tone: "violet",
      },
    ],
    [vaultCounts],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Keep the selected theme in memory if storage is unavailable.
    }
  }, [themeMode]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const pathResult = findNodePath(vaultNodes, selectedItem.node.id);

    if (pathResult) {
      setSelectedItem({ node: pathResult.node, pathSegments: pathResult.pathSegments });
      return;
    }

    setSelectedItem(null);
  }, [selectedItem?.node.id, vaultNodes]);

  const showToast = (message: string, action?: ToastMessage["action"]) => {
    const toastId = `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setToasts((currentToasts) => [...currentToasts, { id: toastId, message, action }]);
    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
    }, 5200);
  };

  const handleNodeSelect = (node: SecureVaultNode, pathSegments: string[]) => {
    setSelectedItem({ node, pathSegments });
    setPathCopied(false);
  };

  const handleCopyPath = async () => {
    if (!selectedItem) {
      return;
    }

    const path = formatFullPath(selectedPathSegments);

    try {
      await navigator.clipboard.writeText(path);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = path;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setPathCopied(true);
    showToast("Path copied.");
    window.setTimeout(() => setPathCopied(false), 1800);
  };

  const handleImportToVault = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const browserFile = event.target.files?.[0];
    event.target.value = "";

    if (!browserFile) {
      return;
    }

    const destinationFolderId = selectedFolder?.id ?? null;
    const destinationPathSegments = selectedFolder ? selectedPathSegments : [];
    const destinationNode = destinationFolderId ? findNodePath(vaultNodes, destinationFolderId)?.node : null;
    const destinationChildren = destinationNode && isFolder(destinationNode) ? destinationNode.children : vaultNodes;
    const importedFile: FileNode = {
      id: `import_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: getUniqueNodeName(destinationChildren, browserFile.name),
      type: "file",
      size: formatStorage(browserFile.size),
      mimeType: browserFile.type || "Not available",
      lastModified: new Date(browserFile.lastModified).toISOString(),
      importedAt: new Date().toISOString(),
    };

    const result = addNodeToFolder(vaultNodes, destinationFolderId, importedFile);
    const addedFile = isFile(result.addedNode) ? result.addedNode : importedFile;

    setVaultNodes(result.nodes);
    setSelectedItem({ node: addedFile, pathSegments: [...destinationPathSegments, addedFile.name] });
    setPathCopied(false);
    showToast("File imported successfully.");
  };

  const handleRenameFile = (fileId: string, nextName: string) => {
    const trimmedName = nextName.trim();

    if (!trimmedName) {
      return;
    }

    const renameResult = renameFileById(vaultNodes, fileId, trimmedName);

    if (!renameResult.renamedFile || !renameResult.pathSegments) {
      return;
    }

    setVaultNodes(renameResult.nodes);
    setSelectedItem({ node: renameResult.renamedFile, pathSegments: renameResult.pathSegments });
    setPathCopied(false);
    showToast("File name updated.");
  };

  const moveSelectedFileToTrash = () => {
    if (!selectedFile) {
      return;
    }

    setPendingConfirmation({ type: "move-to-trash", fileId: selectedFile.id });
  };

  const deleteSelectedFilePermanently = () => {
    if (!selectedFile) {
      return;
    }

    setPendingConfirmation({ type: "delete-vault-file", fileId: selectedFile.id });
  };

  const restoreTrashItem = (trashId: string) => {
    const trashItem = trashItems.find((item) => item.id === trashId);

    if (!trashItem) {
      return;
    }

    const parentStillExists =
      !trashItem.originalParentId || Boolean(findNodePath(vaultNodes, trashItem.originalParentId));
    const destinationParentId = parentStillExists ? trashItem.originalParentId : null;
    const result = addNodeToFolder(vaultNodes, destinationParentId, trashItem.file);
    const restoredFile = isFile(result.addedNode) ? result.addedNode : trashItem.file;
    const restoredPathSegments = parentStillExists
      ? [...trashItem.originalPathSegments.slice(0, -1), restoredFile.name]
      : [restoredFile.name];

    setVaultNodes(result.nodes);
    setTrashItems((currentItems) => currentItems.filter((item) => item.id !== trashId));
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.action?.trashId !== trashId),
    );
    setSelectedItem({ node: restoredFile, pathSegments: restoredPathSegments });
    setPathCopied(false);
    showToast("File restored.");
  };

  const requestTrashPermanentDelete = (trashId: string) => {
    setPendingConfirmation({ type: "delete-trash-file", trashId });
  };

  const confirmMoveToTrash = (fileId: string) => {
    const result = removeFileById(vaultNodes, fileId);

    if (!result) {
      setPendingConfirmation(null);
      return;
    }

    const trashItem: TrashedFileItem = {
      id: `trash_${fileId}_${Date.now()}`,
      file: result.file,
      originalParentId: result.parentIds.length ? result.parentIds[result.parentIds.length - 1] : null,
      originalPathSegments: result.pathSegments,
      trashedAt: new Date().toISOString(),
    };

    setVaultNodes(result.nodes);
    setTrashItems((currentItems) => [trashItem, ...currentItems]);
    setSelectedItem(null);
    setPathCopied(false);
    setPendingConfirmation(null);
    showToast("File moved to Trash.", {
      label: "Undo",
      type: "restore-trash",
      trashId: trashItem.id,
    });
  };

  const confirmVaultPermanentDelete = (fileId: string) => {
    const result = removeFileById(vaultNodes, fileId);

    if (result) {
      setVaultNodes(result.nodes);
      setSelectedItem(null);
      setPathCopied(false);
      showToast("File permanently deleted.");
    }

    setPendingConfirmation(null);
  };

  const confirmTrashPermanentDelete = (trashId: string) => {
    setTrashItems((currentItems) => currentItems.filter((item) => item.id !== trashId));
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.action?.trashId !== trashId),
    );
    setPendingConfirmation(null);
    showToast("File permanently deleted.");
  };

  const handleConfirmPendingAction = () => {
    if (!pendingConfirmation) {
      return;
    }

    if (pendingConfirmation.type === "move-to-trash") {
      confirmMoveToTrash(pendingConfirmation.fileId);
      return;
    }

    if (pendingConfirmation.type === "delete-vault-file") {
      confirmVaultPermanentDelete(pendingConfirmation.fileId);
      return;
    }

    confirmTrashPermanentDelete(pendingConfirmation.trashId);
  };

  const handleToastAction = (toast: ToastMessage) => {
    if (toast.action?.type === "restore-trash") {
      restoreTrashItem(toast.action.trashId);
      setToasts((currentToasts) => currentToasts.filter((item) => item.id !== toast.id));
    }
  };

  const pendingFile =
    pendingConfirmation?.type === "move-to-trash" || pendingConfirmation?.type === "delete-vault-file"
      ? findNodePath(vaultNodes, pendingConfirmation.fileId)?.node
      : null;
  const pendingTrashFile =
    pendingConfirmation?.type === "delete-trash-file"
      ? trashItems.find((item) => item.id === pendingConfirmation.trashId)?.file
      : null;
  const pendingModalContent = pendingConfirmation
    ? {
        title:
          pendingConfirmation.type === "move-to-trash"
            ? "Move file to Trash?"
            : "Delete file permanently?",
        message:
          pendingConfirmation.type === "move-to-trash"
            ? `${pendingFile?.name ?? "This file"} will be moved to Trash and can be restored from the Trash panel.`
            : `${pendingTrashFile?.name ?? pendingFile?.name ?? "This file"} will be removed from this frontend demo. This action cannot be undone here.`,
        confirmLabel: pendingConfirmation.type === "move-to-trash" ? "Move to Trash" : "Delete Permanently",
        tone: pendingConfirmation.type === "move-to-trash" ? "warning" : "danger",
      }
    : null;
  const importDestinationLabel = selectedFolder
    ? `Destination: ${selectedFolder.name}`
    : "Destination: Root vault";
  const isLightMode = themeMode === "light";

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden-file-input"
        onChange={handleFileImport}
        aria-hidden="true"
        tabIndex={-1}
      />
      <header className="topbar">
        <div className="brand-lockup" aria-label="SecureVault Inc.">
          <span className="brand-logo" aria-hidden="true">
            <span className="brand-logo__letters">SV</span>
          </span>
          <div>
            <p className="eyebrow">SecureVault Inc.</p>
            <h1>Cloud Evidence Explorer</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-status" aria-label="Workspace status">
            <span>
              <strong>Protected</strong>
              <small>workspace</small>
            </span>
            <span>
              <strong>Path audit</strong>
              <small>ready</small>
            </span>
            <span>
              <strong>Keyboard</strong>
              <small>enabled</small>
            </span>
          </div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setThemeMode((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
            aria-pressed={isLightMode}
            title={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
          >
            <span className="theme-toggle__track" aria-hidden="true">
              <span className="theme-toggle__icon" />
            </span>
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="dashboard-overview" aria-label="Vault summary metrics">
          <div className="summary-card-grid" aria-label="Vault summary metrics">
            {summaryCards.map((card) => (
              <article className={`summary-card summary-card--${card.tone}`} key={card.label}>
                <div className="summary-card__topline">
                  <span className="summary-card__signal" aria-hidden="true" />
                  <span>{card.label}</span>
                </div>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <BreadcrumbBar
          pathSegments={selectedPathSegments}
          canCopy={Boolean(selectedItem)}
          copied={pathCopied}
          onCopy={handleCopyPath}
        />

        <div className="workspace-grid">
          <FileExplorer
            nodes={vaultNodes}
            selectedNode={selectedNode}
            importDestinationLabel={importDestinationLabel}
            onImportToVault={handleImportToVault}
            onNodeSelect={handleNodeSelect}
          />
          <div className="side-panel-stack">
            <PropertiesPanel
              selectedNode={selectedNode}
              pathSegments={selectedPathSegments}
              onRenameFile={handleRenameFile}
              onMoveToTrash={moveSelectedFileToTrash}
              onDeletePermanently={deleteSelectedFilePermanently}
            />
            <TrashPanel
              items={trashItems}
              onRestore={restoreTrashItem}
              onDeletePermanently={requestTrashPermanentDelete}
            />
          </div>
        </div>
      </main>

      {pendingModalContent ? (
        <ConfirmationModal
          title={pendingModalContent.title}
          message={pendingModalContent.message}
          confirmLabel={pendingModalContent.confirmLabel}
          tone={pendingModalContent.tone as "warning" | "danger"}
          onConfirm={handleConfirmPendingAction}
          onCancel={() => setPendingConfirmation(null)}
        />
      ) : null}

      <ToastContainer
        toasts={toasts}
        onDismiss={(toastId) => setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))}
        onAction={handleToastAction}
      />
    </div>
  );
}
