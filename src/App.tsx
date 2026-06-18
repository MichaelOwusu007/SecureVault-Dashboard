import { useEffect, useMemo, useState } from "react";
import vaultData from "./data/data.json";
import { BreadcrumbBar } from "./components/FileExplorer/BreadcrumbBar";
import { FileExplorer } from "./components/FileExplorer/FileExplorer";
import { PropertiesPanel } from "./components/FileExplorer/PropertiesPanel";
import {
  FileNode,
  SecureVaultNode,
  countNodes,
  findNodePath,
  formatFullPath,
  formatStorage,
  isFile,
} from "./utils/treeUtils";

const nodes = vaultData as SecureVaultNode[];

export default function App() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedPathSegments, setSelectedPathSegments] = useState<string[]>([]);
  const [pathCopied, setPathCopied] = useState(false);
  const vaultCounts = useMemo(() => countNodes(nodes), []);
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
    if (!selectedFile) {
      return;
    }

    const pathResult = findNodePath(nodes, selectedFile.id);

    if (pathResult && isFile(pathResult.node)) {
      setSelectedPathSegments(pathResult.pathSegments);
    }
  }, [selectedFile]);

  const handleFileSelect = (file: FileNode, pathSegments: string[]) => {
    setSelectedFile(file);
    setSelectedPathSegments(pathSegments);
    setPathCopied(false);
  };

  const handleCopyPath = async () => {
    if (!selectedFile) {
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
    window.setTimeout(() => setPathCopied(false), 1800);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="SecureVault Inc.">
          <span className="brand-logo" aria-hidden="true">
            <span className="brand-logo__shield">
              <span className="brand-logo__core" />
            </span>
          </span>
          <div>
            <p className="eyebrow">SecureVault Inc.</p>
            <h1>Cloud Evidence Explorer</h1>
          </div>
        </div>
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
          canCopy={Boolean(selectedFile)}
          copied={pathCopied}
          onCopy={handleCopyPath}
        />

        <div className="workspace-grid">
          <FileExplorer nodes={nodes} selectedFile={selectedFile} onFileSelect={handleFileSelect} />
          <PropertiesPanel selectedFile={selectedFile} pathSegments={selectedPathSegments} />
        </div>
      </main>
    </div>
  );
}
