import { KeyboardEvent, RefCallback } from "react";
import { SecureVaultNode, getNodeIconMeta, isFolder, isFile } from "../../utils/treeUtils";

type TreeNodeProps = {
  node: SecureVaultNode;
  depth: number;
  index: number;
  siblingCount: number;
  pathSegments: string[];
  expandedIds: Set<string>;
  selectedNodeId: string | null;
  focusedId: string | null;
  searchQuery: string;
  registerItem: (id: string) => RefCallback<HTMLDivElement>;
  onFolderToggle: (nodeId: string) => void;
  onFocusItem: (nodeId: string) => void;
  onNodeSelect: (node: SecureVaultNode, pathSegments: string[]) => void;
};

function renderHighlightedName(name: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return name;
  }

  const matchIndex = name.toLowerCase().indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return name;
  }

  const before = name.slice(0, matchIndex);
  const match = name.slice(matchIndex, matchIndex + normalizedQuery.length);
  const after = name.slice(matchIndex + normalizedQuery.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}

export function TreeNode({
  node,
  depth,
  index,
  siblingCount,
  pathSegments,
  expandedIds,
  selectedNodeId,
  focusedId,
  searchQuery,
  registerItem,
  onFolderToggle,
  onFocusItem,
  onNodeSelect,
}: TreeNodeProps) {
  const folder = isFolder(node);
  const file = isFile(node);
  const expanded = folder ? expandedIds.has(node.id) : undefined;
  const selected = selectedNodeId === node.id;
  const currentPath = [...pathSegments, node.name];
  const iconMeta = getNodeIconMeta(node);

  const handleClick = () => {
    onFocusItem(node.id);

    if (folder) {
      onNodeSelect(node, currentPath);
      onFolderToggle(node.id);
      return;
    }

    onNodeSelect(node, currentPath);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <div
        ref={registerItem(node.id)}
        className={`tree-row${selected && file ? " is-selected" : ""}${selected && folder ? " is-destination" : ""}`}
        role="treeitem"
        aria-level={depth}
        aria-expanded={folder ? expanded : undefined}
        aria-selected={selected}
        aria-posinset={index + 1}
        aria-setsize={siblingCount}
        tabIndex={focusedId === node.id ? 0 : -1}
        data-node-id={node.id}
        data-node-type={node.type}
        onClick={handleClick}
        onFocus={() => onFocusItem(node.id)}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: `${12 + (depth - 1) * 20}px` }}
      >
        <span className={`tree-disclosure${expanded ? " is-expanded" : ""}`} aria-hidden="true">
          {folder ? ">" : ""}
        </span>
        <span className={`node-icon node-icon--${iconMeta.kind}`} aria-hidden="true">
          {folder ? null : iconMeta.label}
        </span>
        <span className="node-name">{renderHighlightedName(node.name, searchQuery)}</span>
        {file ? <span className="node-size">{node.size}</span> : null}
      </div>

      {folder && expanded ? (
        <div role="group">
          {node.children.map((child, childIndex) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              index={childIndex}
              siblingCount={node.children.length}
              pathSegments={currentPath}
              expandedIds={expandedIds}
              selectedNodeId={selectedNodeId}
              focusedId={focusedId}
              searchQuery={searchQuery}
              registerItem={registerItem}
              onFolderToggle={onFolderToggle}
              onFocusItem={onFocusItem}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
