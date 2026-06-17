import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileNode,
  SecureVaultNode,
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

  const handleKeyboardNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!visibleItems.length) {
      return;
    }

    const currentIndex = Math.max(
      0,
      visibleItems.findIndex((item) => item.node.id === focusedId),
    );
    const focusedItem = visibleItems[currentIndex];

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const nextItem = visibleItems[Math.min(currentIndex + 1, visibleItems.length - 1)];
        shouldMoveFocusRef.current = true;
        setFocusedId(nextItem.node.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const previousItem = visibleItems[Math.max(currentIndex - 1, 0)];
        shouldMoveFocusRef.current = true;
        setFocusedId(previousItem.node.id);
        break;
      }
      case "ArrowRight": {
        if (isFolder(focusedItem.node) && !effectiveExpandedIds.has(focusedItem.node.id)) {
          event.preventDefault();
          expandFolder(focusedItem.node.id);
        }
        break;
      }
      case "ArrowLeft": {
        if (isFolder(focusedItem.node) && effectiveExpandedIds.has(focusedItem.node.id)) {
          event.preventDefault();
          collapseFolder(focusedItem.node.id);
        } else if (focusedItem.parentId) {
          event.preventDefault();
          shouldMoveFocusRef.current = true;
          setFocusedId(focusedItem.parentId);
        }
        break;
      }
      case "Enter": {
        if (isFile(focusedItem.node)) {
          event.preventDefault();
          const pathResult = findNodePath(nodes, focusedItem.node.id);
          onFileSelect(focusedItem.node, pathResult?.pathSegments ?? focusedItem.pathSegments);
        }
        break;
      }
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
    </section>
  );
}
