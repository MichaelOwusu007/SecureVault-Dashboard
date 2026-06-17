export type FileNode = {
  id: string;
  name: string;
  type: "file";
  size: string;
};

export type FolderNode = {
  id: string;
  name: string;
  type: "folder";
  children: SecureVaultNode[];
};

export type SecureVaultNode = FileNode | FolderNode;

export type VisibleTreeItem = {
  node: SecureVaultNode;
  depth: number;
  parentId: string | null;
  pathSegments: string[];
};

export type NodePathResult = {
  node: SecureVaultNode;
  pathSegments: string[];
  parentIds: string[];
};

export type TreeCounts = {
  files: number;
  folders: number;
};

export const VAULT_ROOT_LABEL = "SecureVault";

export function isFolder(node: SecureVaultNode): node is FolderNode {
  return node.type === "folder";
}

export function isFile(node: SecureVaultNode): node is FileNode {
  return node.type === "file";
}

export function formatFullPath(pathSegments: string[]): string {
  return `/${[VAULT_ROOT_LABEL, ...pathSegments].join("/")}`;
}

export function getTopLevelFolderIds(nodes: SecureVaultNode[]): Set<string> {
  return new Set(nodes.filter(isFolder).map((node) => node.id));
}

export function collectFolderIds(nodes: SecureVaultNode[]): Set<string> {
  const folderIds = new Set<string>();

  function walk(items: SecureVaultNode[]) {
    items.forEach((item) => {
      if (isFolder(item)) {
        folderIds.add(item.id);
        walk(item.children);
      }
    });
  }

  walk(nodes);
  return folderIds;
}

export function flattenVisibleTree(
  nodes: SecureVaultNode[],
  expandedIds: Set<string>,
  pathSegments: string[] = [],
  depth = 1,
  parentId: string | null = null,
): VisibleTreeItem[] {
  return nodes.flatMap((node) => {
    const nextPath = [...pathSegments, node.name];
    const currentItem: VisibleTreeItem = {
      node,
      depth,
      parentId,
      pathSegments: nextPath,
    };

    if (isFolder(node) && expandedIds.has(node.id)) {
      return [
        currentItem,
        ...flattenVisibleTree(node.children, expandedIds, nextPath, depth + 1, node.id),
      ];
    }

    return [currentItem];
  });
}

export function findNodePath(
  nodes: SecureVaultNode[],
  nodeId: string,
  pathSegments: string[] = [],
  parentIds: string[] = [],
): NodePathResult | null {
  for (const node of nodes) {
    const nextPath = [...pathSegments, node.name];

    if (node.id === nodeId) {
      return { node, pathSegments: nextPath, parentIds };
    }

    if (isFolder(node)) {
      const childResult = findNodePath(node.children, nodeId, nextPath, [...parentIds, node.id]);

      if (childResult) {
        return childResult;
      }
    }
  }

  return null;
}

export function filterTreeByQuery(nodes: SecureVaultNode[], query: string): SecureVaultNode[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return nodes;
  }

  return nodes.reduce<SecureVaultNode[]>((matches, node) => {
    const nameMatches = node.name.toLowerCase().includes(normalizedQuery);

    if (isFile(node)) {
      return nameMatches ? [...matches, node] : matches;
    }

    const matchingChildren = filterTreeByQuery(node.children, normalizedQuery);

    if (nameMatches) {
      return [...matches, node];
    }

    if (matchingChildren.length > 0) {
      return [...matches, { ...node, children: matchingChildren }];
    }

    return matches;
  }, []);
}

export function countNodes(nodes: SecureVaultNode[]): TreeCounts {
  return nodes.reduce<TreeCounts>(
    (counts, node) => {
      if (isFolder(node)) {
        const childCounts = countNodes(node.children);
        return {
          files: counts.files + childCounts.files,
          folders: counts.folders + childCounts.folders + 1,
        };
      }

      return {
        files: counts.files + 1,
        folders: counts.folders,
      };
    },
    { files: 0, folders: 0 },
  );
}
