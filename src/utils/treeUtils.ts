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

export type RenameNodeResult = {
  nodes: SecureVaultNode[];
  renamedNode: SecureVaultNode | null;
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

function getMeaningfulExtension(fileName: string): string {
  const trimmedName = fileName.trim();
  const extensionStart = trimmedName.lastIndexOf(".");

  if (extensionStart <= 0 || extensionStart === trimmedName.length - 1) {
    return "";
  }

  return trimmedName.slice(extensionStart + 1).toLowerCase();
}

const specialFileKinds: Record<string, string> = {
  ".env": "Environment Config",
  ".env.example": "Environment Example Config",
  ".env.local": "Environment Config",
  ".gitignore": "Git Ignore Config",
  dockerfile: "Dockerfile",
  license: "License File",
  "package.json": "Package JSON",
  readme: "Documentation File",
  "readme.md": "Markdown Documentation",
  "postcss.config.js": "PostCSS Config",
  "tailwind.config.js": "Tailwind Config",
  "tsconfig.json": "TypeScript Config",
  "vite.config.ts": "Vite Config",
};

const extensionFileKinds: Record<string, string> = {
  "7z": "Archive File",
  avi: "Video File",
  css: "CSS File",
  csv: "CSV File",
  doc: "Word Document",
  docx: "Word Document",
  gif: "Image File",
  html: "HTML File",
  jpeg: "Image File",
  jpg: "Image File",
  js: "JavaScript File",
  json: "JSON File",
  jsx: "React JSX File",
  md: "Markdown File",
  mov: "Video File",
  mp3: "Audio File",
  mp4: "Video File",
  otf: "Font File",
  pdf: "PDF Document",
  png: "Image File",
  ppt: "PowerPoint Presentation",
  pptx: "PowerPoint Presentation",
  rar: "Archive File",
  scss: "SCSS File",
  svg: "Image File",
  ttf: "Font File",
  ts: "TypeScript File",
  tsx: "React TSX File",
  txt: "Text File",
  wav: "Audio File",
  webp: "Image File",
  woff: "Font File",
  woff2: "Font File",
  xls: "Excel Spreadsheet",
  xlsx: "Excel Spreadsheet",
  yaml: "YAML File",
  yml: "YAML File",
  zip: "Archive File",
};

const mimeFileKinds: Record<string, string> = {
  "application/javascript": "JavaScript File",
  "application/json": "JSON File",
  "application/msword": "Word Document",
  "application/pdf": "PDF Document",
  "application/vnd.ms-excel": "Excel Spreadsheet",
  "application/vnd.ms-powerpoint": "PowerPoint Presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
  "application/x-7z-compressed": "Archive File",
  "application/x-rar-compressed": "Archive File",
  "application/zip": "Archive File",
  "audio/mpeg": "Audio File",
  "image/svg+xml": "Image File",
  "text/css": "CSS File",
  "text/csv": "CSV File",
  "text/html": "HTML File",
  "text/javascript": "JavaScript File",
  "text/markdown": "Markdown File",
  "text/plain": "Text File",
};

export function getFileKind(fileName: string, mimeType?: string): string {
  const normalizedName = fileName.trim().toLowerCase();
  const specialKind = specialFileKinds[normalizedName];

  if (specialKind) {
    return specialKind;
  }

  const extension = getMeaningfulExtension(fileName);
  const extensionKind = extension ? extensionFileKinds[extension] : undefined;

  if (extensionKind) {
    return extensionKind;
  }

  if (!extension) {
    return "File";
  }

  const normalizedMimeType = mimeType?.trim().toLowerCase();

  if (normalizedMimeType) {
    const mimeKind = mimeFileKinds[normalizedMimeType];

    if (mimeKind) {
      return mimeKind;
    }

    if (normalizedMimeType.startsWith("image/")) {
      return "Image File";
    }

    if (normalizedMimeType.startsWith("video/")) {
      return "Video File";
    }

    if (normalizedMimeType.startsWith("audio/")) {
      return "Audio File";
    }
  }

  return "File";
}

export function getNodeIconMeta(node: SecureVaultNode): NodeIconMeta {
  if (isFolder(node)) {
    return { kind: "folder", label: "Folder" };
  }

  const normalizedName = node.name.trim().toLowerCase();

  if (normalizedName === ".gitignore") {
    return { kind: "generic", label: "GIT" };
  }

  if (normalizedName.startsWith(".env")) {
    return { kind: "generic", label: "ENV" };
  }

  if (normalizedName === "readme" || normalizedName === "readme.md") {
    return { kind: "txt", label: "DOC" };
  }

  if (normalizedName === "license") {
    return { kind: "txt", label: "LIC" };
  }

  if (normalizedName === "dockerfile") {
    return { kind: "generic", label: "DKR" };
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

  if (extension === "json") {
    return { kind: "generic", label: "JSON" };
  }

  if (extension === "md") {
    return { kind: "txt", label: "MD" };
  }

  if (extension === "csv") {
    return { kind: "generic", label: "CSV" };
  }

  if (extension === "ppt" || extension === "pptx") {
    return { kind: "generic", label: "PPT" };
  }

  if (extension === "js" || extension === "jsx") {
    return { kind: "generic", label: "JS" };
  }

  if (extension === "ts" || extension === "tsx") {
    return { kind: "generic", label: "TS" };
  }

  if (extension === "html") {
    return { kind: "generic", label: "HTML" };
  }

  if (extension === "css" || extension === "scss") {
    return { kind: "generic", label: "CSS" };
  }

  if (extension === "yaml" || extension === "yml") {
    return { kind: "yaml", label: "YML" };
  }

  if (["jpg", "jpeg", "webp", "gif"].includes(extension)) {
    return { kind: "png", label: "IMG" };
  }

  if (extension === "svg") {
    return { kind: "svg", label: "SVG" };
  }

  if (["mp4", "mov", "avi"].includes(extension)) {
    return { kind: "generic", label: "VID" };
  }

  if (["mp3", "wav"].includes(extension)) {
    return { kind: "generic", label: "AUD" };
  }

  if (["zip", "rar", "7z"].includes(extension)) {
    return { kind: "generic", label: "ZIP" };
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

export function renameNodeById(
  nodes: SecureVaultNode[],
  nodeId: string,
  requestedName: string,
  pathSegments: string[] = [],
  parentIds: string[] = [],
): RenameNodeResult {
  let renamedNode: SecureVaultNode | null = null;
  let renamedPathSegments: string[] | null = null;
  let renamedParentIds: string[] = [];

  const nextNodes = nodes.map((node) => {
    if (node.id === nodeId) {
      const siblingNodes = nodes.filter((sibling) => sibling.id !== nodeId);
      const uniqueName = getUniqueNodeName(siblingNodes, requestedName);
      renamedNode = { ...node, name: uniqueName };
      renamedPathSegments = [...pathSegments, uniqueName];
      renamedParentIds = parentIds;
      return renamedNode;
    }

    if (isFolder(node)) {
      const childResult = renameNodeById(
        node.children,
        nodeId,
        requestedName,
        [...pathSegments, node.name],
        [...parentIds, node.id],
      );

      if (childResult.renamedNode) {
        renamedNode = childResult.renamedNode;
        renamedPathSegments = childResult.pathSegments;
        renamedParentIds = childResult.parentIds;
        return { ...node, children: childResult.nodes };
      }
    }

    return node;
  });

  return {
    nodes: nextNodes,
    renamedNode,
    pathSegments: renamedPathSegments,
    parentIds: renamedParentIds,
  };
}

export function collectNodeIds(nodes: SecureVaultNode[]): Set<string> {
  const nodeIds = new Set<string>();

  function walk(items: SecureVaultNode[]) {
    items.forEach((item) => {
      nodeIds.add(item.id);

      if (isFolder(item)) {
        walk(item.children);
      }
    });
  }

  walk(nodes);
  return nodeIds;
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

export function collectExpandableFolderIds(nodes: SecureVaultNode[]): Set<string> {
  const folderIds = new Set<string>();

  function walk(items: SecureVaultNode[]) {
    items.forEach((item) => {
      if (isFolder(item)) {
        if (item.children.length > 0) {
          folderIds.add(item.id);
        }

        walk(item.children);
      }
    });
  }

  walk(nodes);
  return folderIds;
}

export function duplicateNodeWithFreshIds(
  node: SecureVaultNode,
  existingIds: Set<string> = new Set<string>(),
): SecureVaultNode {
  const usedIds = new Set(existingIds);

  function createNodeId(type: SecureVaultNode["type"]) {
    let nextId = "";

    do {
      nextId = `${type}_copy_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    } while (usedIds.has(nextId));

    usedIds.add(nextId);
    return nextId;
  }

  function duplicate(item: SecureVaultNode): SecureVaultNode {
    if (isFolder(item)) {
      return {
        ...item,
        id: createNodeId(item.type),
        children: item.children.map(duplicate),
      };
    }

    return {
      ...item,
      id: createNodeId(item.type),
    };
  }

  return duplicate(node);
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

export function filterTreeByQuery(
  nodes: SecureVaultNode[],
  query: string,
  openedFolderId: string | null = null,
): SecureVaultNode[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return nodes;
  }

  return nodes.reduce<SecureVaultNode[]>((matches, node) => {
    const nameMatches = node.name.toLowerCase().includes(normalizedQuery);

    if (isFile(node)) {
      return nameMatches ? [...matches, node] : matches;
    }

    const matchingChildren = filterTreeByQuery(node.children, normalizedQuery, openedFolderId);

    if (node.id === openedFolderId && nameMatches) {
      return [...matches, node];
    }

    if (nameMatches || matchingChildren.length > 0) {
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
