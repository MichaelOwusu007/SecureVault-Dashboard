export type FileNode = {
  id: string;
  name: string;
  type: "file";
  size: string;
  mimeType?: string;
  lastModified?: string;
  importedAt?: string;
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

export type RemovedFileResult = {
  nodes: SecureVaultNode[];
  file: FileNode;
  pathSegments: string[];
  parentIds: string[];
};

export type RenameFileResult = {
  nodes: SecureVaultNode[];
  renamedFile: FileNode | null;
  pathSegments: string[] | null;
  parentIds: string[];
};

export type TrashedFileItem = {
  id: string;
  file: FileNode;
  originalParentId: string | null;
  originalPathSegments: string[];
  trashedAt: string;
};

export type TreeCounts = {
  files: number;
  folders: number;
  storageBytes: number;
  fileTypes: Set<string>;
};

export type FileIconKind = "pdf" | "docx" | "xlsx" | "png" | "txt" | "yaml" | "svg" | "font" | "generic";

export type NodeIconMeta = {
  kind: "folder" | FileIconKind;
  label: string;
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

export function formatDisplayDate(value?: string): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop();
  return extension && extension !== fileName ? extension.toLowerCase() : "file";
}

export function getNodeIconMeta(node: SecureVaultNode): NodeIconMeta {
  if (isFolder(node)) {
    return { kind: "folder", label: "Folder" };
  }

  const extension = getFileExtension(node.name);

  if (extension === "pdf") {
    return { kind: "pdf", label: "PDF" };
  }

  if (extension === "docx" || extension === "doc") {
    return { kind: "docx", label: "DOC" };
  }

  if (extension === "xlsx" || extension === "xls") {
    return { kind: "xlsx", label: "XLS" };
  }

  if (extension === "png") {
    return { kind: "png", label: "PNG" };
  }

  if (extension === "txt") {
    return { kind: "txt", label: "TXT" };
  }

  if (extension === "yaml" || extension === "yml") {
    return { kind: "yaml", label: "YML" };
  }

  if (extension === "svg") {
    return { kind: "svg", label: "SVG" };
  }

  if (extension === "ttf" || extension === "otf" || extension === "woff" || extension === "woff2") {
    return { kind: "font", label: "FNT" };
  }

  return { kind: "generic", label: extension.slice(0, 3).toUpperCase() };
}

export function parseFileSizeToBytes(size: string): number {
  const match = size.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)$/i);

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2].toUpperCase();

  if (Number.isNaN(value)) {
    return 0;
  }

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return value * multipliers[unit];
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }

  return `${bytes.toFixed(0)}B`;
}

export function getUniqueNodeName(nodes: SecureVaultNode[], requestedName: string): string {
  const existingNames = new Set(nodes.map((node) => node.name.toLowerCase()));

  if (!existingNames.has(requestedName.toLowerCase())) {
    return requestedName;
  }

  const extensionIndex = requestedName.lastIndexOf(".");
  const hasExtension = extensionIndex > 0;
  const baseName = hasExtension ? requestedName.slice(0, extensionIndex) : requestedName;
  const extension = hasExtension ? requestedName.slice(extensionIndex) : "";
  let nextIndex = 2;

  while (existingNames.has(`${baseName} (${nextIndex})${extension}`.toLowerCase())) {
    nextIndex += 1;
  }

  return `${baseName} (${nextIndex})${extension}`;
}

export function addNodeToFolder(
  nodes: SecureVaultNode[],
  folderId: string | null,
  nodeToAdd: SecureVaultNode,
): { nodes: SecureVaultNode[]; addedNode: SecureVaultNode } {
  if (!folderId) {
    const addedNode = { ...nodeToAdd, name: getUniqueNodeName(nodes, nodeToAdd.name) };
    return { nodes: [...nodes, addedNode], addedNode };
  }

  let addedNode: SecureVaultNode | null = null;

  const nextNodes = nodes.map((node) => {
    if (!isFolder(node)) {
      return node;
    }

    if (node.id === folderId) {
      addedNode = { ...nodeToAdd, name: getUniqueNodeName(node.children, nodeToAdd.name) };
      return { ...node, children: [...node.children, addedNode] };
    }

    const result = addNodeToFolder(node.children, folderId, nodeToAdd);

    if (result.addedNode !== nodeToAdd) {
      addedNode = result.addedNode;
      return { ...node, children: result.nodes };
    }

    return node;
  });

  return { nodes: nextNodes, addedNode: addedNode ?? nodeToAdd };
}

export function removeFileById(
  nodes: SecureVaultNode[],
  fileId: string,
  pathSegments: string[] = [],
  parentIds: string[] = [],
): RemovedFileResult | null {
  for (const node of nodes) {
    const nextPath = [...pathSegments, node.name];

    if (isFile(node) && node.id === fileId) {
      return {
        nodes: nodes.filter((item) => item.id !== fileId),
        file: node,
        pathSegments: nextPath,
        parentIds,
      };
    }

    if (isFolder(node)) {
      const childResult = removeFileById(node.children, fileId, nextPath, [...parentIds, node.id]);

      if (childResult) {
        return {
          ...childResult,
          nodes: nodes.map((item) =>
            item.id === node.id && isFolder(item) ? { ...item, children: childResult.nodes } : item,
          ),
        };
      }
    }
  }

  return null;
}

export function renameFileById(
  nodes: SecureVaultNode[],
  fileId: string,
  requestedName: string,
  pathSegments: string[] = [],
  parentIds: string[] = [],
): RenameFileResult {
  let renamedFile: FileNode | null = null;
  let renamedPathSegments: string[] | null = null;
  let renamedParentIds: string[] = [];

  const nextNodes = nodes.map((node) => {
    if (isFile(node) && node.id === fileId) {
      const siblingNodes = nodes.filter((sibling) => sibling.id !== fileId);
      const uniqueName = getUniqueNodeName(siblingNodes, requestedName);
      renamedFile = { ...node, name: uniqueName };
      renamedPathSegments = [...pathSegments, uniqueName];
      renamedParentIds = parentIds;
      return renamedFile;
    }

    if (isFolder(node)) {
      const childResult = renameFileById(
        node.children,
        fileId,
        requestedName,
        [...pathSegments, node.name],
        [...parentIds, node.id],
      );

      if (childResult.renamedFile) {
        renamedFile = childResult.renamedFile;
        renamedPathSegments = childResult.pathSegments;
        renamedParentIds = childResult.parentIds;
        return { ...node, children: childResult.nodes };
      }
    }

    return node;
  });

  return {
    nodes: nextNodes,
    renamedFile,
    pathSegments: renamedPathSegments,
    parentIds: renamedParentIds,
  };
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
        childCounts.fileTypes.forEach((fileType) => counts.fileTypes.add(fileType));

        return {
          files: counts.files + childCounts.files,
          folders: counts.folders + childCounts.folders + 1,
          storageBytes: counts.storageBytes + childCounts.storageBytes,
          fileTypes: counts.fileTypes,
        };
      }

      counts.fileTypes.add(getFileExtension(node.name));

      return {
        files: counts.files + 1,
        folders: counts.folders,
        storageBytes: counts.storageBytes + parseFileSizeToBytes(node.size),
        fileTypes: counts.fileTypes,
      };
    },
    { files: 0, folders: 0, storageBytes: 0, fileTypes: new Set<string>() },
  );
}
