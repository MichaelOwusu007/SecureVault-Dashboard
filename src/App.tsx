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
  isFile,
} from "./utils/treeUtils";

const nodes = vaultData as SecureVaultNode[];

export default function App() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedPathSegments, setSelectedPathSegments] = useState<string[]>([]);
  const [pathCopied, setPathCopied] = useState(false);
  const vaultCounts = useMemo(() => countNodes(nodes), []);

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
          <span className="brand-mark">SV</span>
          <div>
            <p className="eyebrow">SecureVault Inc.</p>
            <h1>Cloud Evidence Explorer</h1>
          </div>
        </div>
        <div className="topbar-metrics" aria-label="Vault summary">
          <span>{vaultCounts.folders} folders</span>
          <span>{vaultCounts.files} files</span>
          <span>Zero-trust session</span>
        </div>
      </header>

      <main className="main-layout">
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
