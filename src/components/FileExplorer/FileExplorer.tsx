import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileNode,
  SecureVaultNode,
  VisibleTreeItem,
  collectFolderIds,
  filterTreeByQuery,
  findNodePath,
  flattenVisibleTree,
  getTopLevelFolderIds,
  isFile,
  isFolder,
} from "../../utils/treeUtils";
import { EmptyState } from "./EmptyState";
import { SearchBar } from "./SearchBar";
import { TreeNode } from "./TreeNode";

type FileExplorerProps = {
  nodes: SecureVaultNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode, pathSegments: string[]) => void;
};

type ExplorerCommand = "previous" | "next" | "expand" | "collapse" | "select";

function getVisibleIndex(items: VisibleTreeItem[], focusedId: string | null) {
  return Math.max(
    0,
    items.findIndex((item) => item.node.id === focusedId),
  );
}

export function FileExplorer({ nodes, selectedFile, onFileSelect }: FileExplorerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => getTopLevelFolderIds(nodes));
  const [focusedId, setFocusedId] = useState<string | null>(() => nodes[0]?.id ?? null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const shouldMoveFocusRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const filteredNodes = useMemo(
    () => filterTreeByQuery(nodes, debouncedSearchQuery),
    [nodes, debouncedSearchQuery],
  );
  const searchableFolderIds = useMemo(() => collectFolderIds(filteredNodes), [filteredNodes]);

  const effectiveExpandedIds = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return expandedIds;
    }

    return new Set([...expandedIds, ...searchableFolderIds]);
  }, [expandedIds, debouncedSearchQuery, searchableFolderIds]);

  const visibleItems = useMemo(
    () => flattenVisibleTree(filteredNodes, effectiveExpandedIds),
    [filteredNodes, effectiveExpandedIds],
  );

  const currentIndex = visibleItems.length ? getVisibleIndex(visibleItems, focusedId) : -1;
  const focusedItem = currentIndex >= 0 ? visibleItems[currentIndex] : null;
  const focusedNode = focusedItem?.node ?? null;
  const focusedNodeIsFolder = focusedNode ? isFolder(focusedNode) : false;
  const focusedNodeIsFile = focusedNode ? isFile(focusedNode) : false;
  const canExpand =
    Boolean(focusedNode && focusedNodeIsFolder) && !effectiveExpandedIds.has(focusedNode?.id ?? "");
  const canCollapse =
    Boolean(focusedItem?.parentId) ||
    (Boolean(focusedNode && focusedNodeIsFolder) && effectiveExpandedIds.has(focusedNode?.id ?? ""));

  useEffect(() => {
    if (!visibleItems.length) {
      setFocusedId(null);
      return;
    }

    if (!focusedId || !visibleItems.some((item) => item.node.id === focusedId)) {
      setFocusedId(visibleItems[0].node.id);
    }
  }, [focusedId, visibleItems]);

  useEffect(() => {
    if (!focusedId || !shouldMoveFocusRef.current) {
      return;
    }

    itemRefs.current.get(focusedId)?.focus({ preventScroll: true });
    shouldMoveFocusRef.current = false;
  }, [focusedId]);

  const registerItem = useCallback(
    (id: string) => (element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

  const focusTreeItem = useCallback((nodeId: string) => {
    shouldMoveFocusRef.current = true;
    setFocusedId(nodeId);
    window.requestAnimationFrame(() => {
      itemRefs.current.get(nodeId)?.focus({ preventScroll: true });
    });
  }, []);

  const toggleFolder = useCallback((nodeId: string) => {
    setExpandedIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);

      if (nextExpandedIds.has(nodeId)) {
        nextExpandedIds.delete(nodeId);
      } else {
        nextExpandedIds.add(nodeId);
      }

      return nextExpandedIds;
    });
  }, []);

  const expandFolder = useCallback((nodeId: string) => {
    setExpandedIds((currentExpandedIds) => new Set(currentExpandedIds).add(nodeId));
  }, []);

  const collapseFolder = useCallback((nodeId: string) => {
    setExpandedIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);
      nextExpandedIds.delete(nodeId);
      return nextExpandedIds;
    });
  }, []);

  const handleFileSelect = (node: SecureVaultNode, pathSegments: string[]) => {
    if (isFile(node)) {
      onFileSelect(node, pathSegments);
    }
  };

  const runExplorerCommand = useCallback(
    (command: ExplorerCommand) => {
      if (!visibleItems.length) {
        return;
      }

      const index = getVisibleIndex(visibleItems, focusedId);
      const currentItem = visibleItems[index];
      const currentNode = currentItem.node;

      if (command === "next") {
        focusTreeItem(visibleItems[Math.min(index + 1, visibleItems.length - 1)].node.id);
        return;
      }

      if (command === "previous") {
        focusTreeItem(visibleItems[Math.max(index - 1, 0)].node.id);
        return;
      }

      if (command === "expand" && isFolder(currentNode)) {
        expandFolder(currentNode.id);
        focusTreeItem(currentNode.id);
        return;
      }

      if (command === "collapse") {
        if (isFolder(currentNode) && effectiveExpandedIds.has(currentNode.id)) {
          collapseFolder(currentNode.id);
          focusTreeItem(currentNode.id);
          return;
        }

        if (currentItem.parentId) {
          focusTreeItem(currentItem.parentId);
        }

        return;
      }

      if (command === "select" && isFile(currentNode)) {
        const pathResult = findNodePath(nodes, currentNode.id);
        onFileSelect(currentNode, pathResult?.pathSegments ?? currentItem.pathSegments);
        focusTreeItem(currentNode.id);
      }
    },
    [
      collapseFolder,
      effectiveExpandedIds,
      expandFolder,
      focusTreeItem,
      focusedId,
      nodes,
      onFileSelect,
      visibleItems,
    ],
  );

  const handleKeyboardNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!visibleItems.length) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        runExplorerCommand("next");
        break;
      case "ArrowUp":
        event.preventDefault();
        runExplorerCommand("previous");
        break;
      case "ArrowRight":
        event.preventDefault();
        runExplorerCommand("expand");
        break;
      case "ArrowLeft":
        event.preventDefault();
        runExplorerCommand("collapse");
        break;
      case "Enter":
        if (focusedNodeIsFile) {
          event.preventDefault();
          runExplorerCommand("select");
        }
        break;
      default:
        break;
    }
  };

  return (
    <section className="explorer-panel" aria-label="SecureVault file explorer">
      <div className="explorer-panel__header">
        <div>
          <p className="eyebrow">File explorer</p>
          <h2>Vault records</h2>
        </div>
        <span className="sync-badge">Protected</span>
      </div>

      <SearchBar value={searchInput} onChange={setSearchInput} resultCount={visibleItems.length} />

      <div
        className="tree-shell"
        id="securevault-folder-tree"
        role="tree"
        aria-label="SecureVault folder tree"
        onKeyDown={handleKeyboardNavigation}
      >
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node, index) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={1}
              index={index}
              siblingCount={filteredNodes.length}
              pathSegments={[]}
              expandedIds={effectiveExpandedIds}
              selectedFileId={selectedFile?.id ?? null}
              focusedId={focusedId}
              searchQuery={debouncedSearchQuery}
              registerItem={registerItem}
              onFolderToggle={toggleFolder}
              onFocusItem={setFocusedId}
              onFileSelect={handleFileSelect}
            />
          ))
        ) : (
          <EmptyState query={debouncedSearchQuery} />
        )}
      </div>

      <aside className="command-help command-help--floating" aria-label="Keyboard command controls">
        <div className="command-help__header">
          <p className="eyebrow">Command help</p>
          <h2>Keyboard flow</h2>
        </div>
        <div className="command-action-grid">
          <button
            type="button"
            onClick={() => runExplorerCommand("previous")}
            disabled={currentIndex <= 0}
            aria-label="Move focus to previous visible item"
          >
            <kbd aria-hidden="true">&uarr;</kbd>
            <span>Navigate</span>
          </button>
          <button
            type="button"
            onClick={() => runExplorerCommand("next")}
            disabled={currentIndex < 0 || currentIndex >= visibleItems.length - 1}
            aria-label="Move focus to next visible item"
          >
            <kbd aria-hidden="true">&darr;</kbd>
            <span>Navigate</span>
          </button>
          <button
            type="button"
            onClick={() => runExplorerCommand("expand")}
            disabled={!canExpand}
            aria-label="Expand focused folder"
          >
            <kbd aria-hidden="true">&rarr;</kbd>
            <span>Expand</span>
          </button>
          <button
            type="button"
            onClick={() => runExplorerCommand("collapse")}
            disabled={!canCollapse}
            aria-label="Collapse focused folder or move to parent folder"
          >
            <kbd aria-hidden="true">&larr;</kbd>
            <span>Collapse</span>
          </button>
          <button
            type="button"
            className="command-action--wide"
            onClick={() => runExplorerCommand("select")}
            disabled={!focusedNodeIsFile}
            aria-label="Select focused file"
          >
            <kbd aria-hidden="true">Enter</kbd>
            <span>Select</span>
          </button>
        </div>
      </aside>
    </section>
  );
}
