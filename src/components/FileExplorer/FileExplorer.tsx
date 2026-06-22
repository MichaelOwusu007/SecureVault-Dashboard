import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FolderNode,
  SecureVaultNode,
  VisibleTreeItem,
  collectExpandableFolderIds,
  collectFolderIds,
  filterTreeByQuery,
  findNodePath,
  flattenVisibleTree,
  isFile,
  isFolder,
} from "../../utils/treeUtils";
import { EmptyState } from "./EmptyState";
import { SearchBar } from "./SearchBar";
import { TreeNode } from "./TreeNode";
import { VaultContextMenu } from "./VaultContextMenu";

type FileExplorerProps = {
  nodes: SecureVaultNode[];
  selectedNode: SecureVaultNode | null;
  importDestinationLabel: string;
  hasClipboard: boolean;
  onImportToVault: () => void;
  onNodeSelect: (node: SecureVaultNode, pathSegments: string[]) => void;
  onCopyNode: (node: SecureVaultNode, pathSegments: string[]) => void;
  onPasteIntoFolder: (folder: FolderNode, pathSegments: string[]) => void;
  onRequestRename: (node: SecureVaultNode, pathSegments: string[]) => void;
  onCopyNodePath: (node: SecureVaultNode, pathSegments: string[]) => void;
  onMoveFileToTrash: (node: SecureVaultNode, pathSegments: string[]) => void;
  onDeleteFilePermanently: (node: SecureVaultNode, pathSegments: string[]) => void;
};

type ExplorerCommand = "previous" | "next" | "expand" | "collapse" | "select";

type ContextMenuState = {
  node: SecureVaultNode;
  pathSegments: string[];
  x: number;
  y: number;
};

const EXPANDED_FOLDERS_STORAGE_KEY = "securevault-expanded-folder-ids";

function isReloadNavigation() {
  if (typeof window === "undefined" || !("performance" in window)) {
    return false;
  }

  const [navigationEntry] = window.performance.getEntriesByType("navigation");
  return (navigationEntry as PerformanceNavigationTiming | undefined)?.type === "reload";
}

function getInitialExpandedIds(nodes: SecureVaultNode[]) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  if (!isReloadNavigation()) {
    try {
      window.sessionStorage.removeItem(EXPANDED_FOLDERS_STORAGE_KEY);
    } catch {
      // Starting collapsed is still safe if session storage is unavailable.
    }

    return new Set<string>();
  }

  try {
    const storedExpandedIds = window.sessionStorage.getItem(EXPANDED_FOLDERS_STORAGE_KEY);
    const parsedExpandedIds: unknown = storedExpandedIds ? JSON.parse(storedExpandedIds) : [];

    if (!Array.isArray(parsedExpandedIds)) {
      return new Set<string>();
    }

    const folderIds = collectFolderIds(nodes);
    return new Set(
      parsedExpandedIds.filter((nodeId): nodeId is string => typeof nodeId === "string" && folderIds.has(nodeId)),
    );
  } catch {
    return new Set<string>();
  }
}

function getVisibleIndex(items: VisibleTreeItem[], focusedId: string | null) {
  return Math.max(
    0,
    items.findIndex((item) => item.node.id === focusedId),
  );
}

export function FileExplorer({
  nodes,
  selectedNode,
  importDestinationLabel,
  hasClipboard,
  onImportToVault,
  onNodeSelect,
  onCopyNode,
  onPasteIntoFolder,
  onRequestRename,
  onCopyNodePath,
  onMoveFileToTrash,
  onDeleteFilePermanently,
}: FileExplorerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => getInitialExpandedIds(nodes));
  const [focusedId, setFocusedId] = useState<string | null>(() => nodes[0]?.id ?? null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [openedSearchFolderId, setOpenedSearchFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const shouldMoveFocusRef = useRef(false);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify([...expandedIds]));
    } catch {
      // Folder expansion remains available in memory if session storage is unavailable.
    }
  }, [expandedIds]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeContextMenu = () => setContextMenu(null);
    const closeContextMenuFromKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    };

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("keydown", closeContextMenuFromKey);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      window.removeEventListener("keydown", closeContextMenuFromKey);
    };
  }, [contextMenu]);

  const filteredNodes = useMemo(
    () => filterTreeByQuery(nodes, debouncedSearchQuery, openedSearchFolderId),
    [nodes, debouncedSearchQuery, openedSearchFolderId],
  );
  const searchableFolderIds = useMemo(() => {
    if (openedSearchFolderId && debouncedSearchQuery.trim()) {
      const openedFolderPath = findNodePath(filteredNodes, openedSearchFolderId);

      if (openedFolderPath) {
        return new Set([...openedFolderPath.parentIds, openedSearchFolderId]);
      }
    }

    return collectExpandableFolderIds(filteredNodes);
  }, [debouncedSearchQuery, filteredNodes, openedSearchFolderId]);

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setOpenedSearchFolderId(null);
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

  const expandFolderPath = useCallback((nodeIds: string[]) => {
    setExpandedIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);
      nodeIds.forEach((nodeId) => nextExpandedIds.add(nodeId));
      return nextExpandedIds;
    });
  }, []);

  const collapseFolder = useCallback((nodeId: string) => {
    setExpandedIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);
      nextExpandedIds.delete(nodeId);
      return nextExpandedIds;
    });
  }, []);

  const openContextMenu = useCallback(
    (node: SecureVaultNode, pathSegments: string[], position: { x: number; y: number }) => {
      setContextMenu({ node, pathSegments, ...position });
    },
    [],
  );

  const pasteIntoContextFolder = useCallback(
    (folder: FolderNode, pathSegments: string[]) => {
      expandFolder(folder.id);
      onPasteIntoFolder(folder, pathSegments);
    },
    [expandFolder, onPasteIntoFolder],
  );

  const openVisibleItem = useCallback(
    (item: VisibleTreeItem) => {
      const pathResult = findNodePath(nodes, item.node.id);
      const selectedNode = pathResult?.node ?? item.node;
      const selectedPathSegments = pathResult?.pathSegments ?? item.pathSegments;
      const parentIds = pathResult?.parentIds ?? [];

      onNodeSelect(selectedNode, selectedPathSegments);

      if (isFolder(selectedNode)) {
        expandFolderPath([...parentIds, selectedNode.id]);
        setOpenedSearchFolderId(searchInput.trim() || debouncedSearchQuery.trim() ? selectedNode.id : null);
      } else if (parentIds.length > 0) {
        expandFolderPath(parentIds);
        setOpenedSearchFolderId(null);
      } else {
        setOpenedSearchFolderId(null);
      }

      focusTreeItem(selectedNode.id);
    },
    [debouncedSearchQuery, expandFolderPath, focusTreeItem, nodes, onNodeSelect, searchInput],
  );

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

      if (command === "select") {
        openVisibleItem(currentItem);
      }
    },
    [
      collapseFolder,
      effectiveExpandedIds,
      expandFolder,
      focusTreeItem,
      focusedId,
      openVisibleItem,
      visibleItems,
    ],
  );

  const handleSearchEnter = useCallback(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();
    const matchingItem = normalizedSearch
      ? visibleItems.find((item) => item.node.name.toLowerCase().includes(normalizedSearch))
      : null;

    if (matchingItem) {
      openVisibleItem(matchingItem);
      return;
    }

    runExplorerCommand("select");
  }, [openVisibleItem, runExplorerCommand, searchInput, visibleItems]);

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
        event.preventDefault();
        runExplorerCommand("select");
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
        <div className="explorer-toolbar">
          <span className="destination-chip" title={`Import destination: ${importDestinationLabel}`}>
            {importDestinationLabel}
          </span>
          <button className="import-button" type="button" onClick={onImportToVault}>
            Import to Vault
          </button>
        </div>
      </div>

      <SearchBar
        value={searchInput}
        onChange={handleSearchChange}
        onEnter={handleSearchEnter}
        resultCount={visibleItems.length}
      />

      <div
        className="tree-shell"
        id="securevault-folder-tree"
        role="tree"
        aria-label="SecureVault folder tree"
        onKeyDown={handleKeyboardNavigation}
        onContextMenu={(event) => event.preventDefault()}
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
              selectedNodeId={selectedNode?.id ?? null}
              focusedId={focusedId}
              searchQuery={debouncedSearchQuery}
              registerItem={registerItem}
              onFolderToggle={toggleFolder}
              onFocusItem={setFocusedId}
              onNodeSelect={onNodeSelect}
              onOpenContextMenu={openContextMenu}
            />
          ))
        ) : (
          <EmptyState query={debouncedSearchQuery} />
        )}
      </div>

      {contextMenu ? (
        <VaultContextMenu
          node={contextMenu.node}
          pathSegments={contextMenu.pathSegments}
          x={contextMenu.x}
          y={contextMenu.y}
          canPaste={hasClipboard}
          onCopyNode={onCopyNode}
          onPasteIntoFolder={pasteIntoContextFolder}
          onRequestRename={onRequestRename}
          onCopyPath={onCopyNodePath}
          onMoveFileToTrash={onMoveFileToTrash}
          onDeleteFilePermanently={onDeleteFilePermanently}
          onSetImportDestination={onNodeSelect}
          onClose={() => setContextMenu(null)}
        />
      ) : null}

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
            disabled={!focusedNode}
            aria-label={focusedNodeIsFile ? "Select focused file" : "Open focused folder"}
          >
            <kbd aria-hidden="true">Enter</kbd>
            <span>{focusedNodeIsFolder ? "Open" : "Select"}</span>
          </button>
        </div>
      </aside>
    </section>
  );
}
