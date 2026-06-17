# SecureVault Dashboard

SecureVault Dashboard is a dark-mode enterprise cloud security file explorer built for SecureVault Inc. It presents nested legal, finance, security, and shared resource records in a fast, keyboard-accessible interface that can scale from shallow folders to deeply nested case archives.

## Business Problem

SecureVault customers in legal and banking environments need to inspect sensitive file structures without losing context. A flat file list makes it easy to miss nested evidence, reference the wrong version, or copy an incomplete path into a legal or compliance workflow. This dashboard solves that by combining a recursive tree, metadata inspection, search, and exact path copying.

## Tech Stack

- React
- TypeScript
- Vite
- Custom CSS
- No Bootstrap, Material UI, Chakra UI, Ant Design, or component library

## Setup Instructions

```bash
npm install
npm run dev
```

Open the local app at:

```text
http://127.0.0.1:5173/
```

Do not open `index.html` directly from the file system. Vite needs to serve the React, TypeScript, and JSON modules during development.

For a production check:

```bash
npm run build
```

## Links

- Design file: `TODO: Add Figma/Penpot/PDF link here`
- Live demo: `TODO: Add deployed demo link here`

## Data Source

The app uses the provided `data.json` structure exactly: every node keeps its `id`, `name`, `type`, optional `children`, and optional `size` fields. A matching copy lives at `src/data/data.json` so Vite can import it directly from the application source without changing the JSON shape.

## Features

- Recursive file and folder tree using the provided `data.json` structure
- Expand and collapse folders on click
- File selection with a clear selected state
- Right-side properties panel with name, type, size, and full path
- Keyboard navigation with ArrowUp, ArrowDown, ArrowRight, ArrowLeft, and Enter
- Accessible tree roles and states with `role="tree"`, `role="treeitem"`, `aria-expanded`, and `aria-selected`
- Breadcrumb path bar for the selected file
- Copy path button with a "Path copied" confirmation
- Search and filter across folders and files
- 300ms debounced search input to avoid recursive filtering on every keystroke
- Deep search results automatically reveal parent folders
- Responsive layout for desktop, tablet, and mobile

## Recursive Strategy

The explorer is powered by `TreeNode.tsx`, a recursive component. Each `TreeNode` renders one file or folder. When the node is a folder and its `id` exists in the expanded set, the component maps over `children` and renders more `TreeNode` instances. Because each level repeats the same component contract, the tree can handle two levels or twenty levels without special-case layout logic.

Tree utilities in `src/utils/treeUtils.ts` keep the data work separate from rendering. They flatten only the currently visible nodes for keyboard navigation, find a selected file path by walking the tree, count files and folders for the dashboard summary, and filter the tree for search while preserving the original JSON shape.

## Search Strategy

The search input uses two pieces of state: the immediate input value and a 300ms debounced query. The input stays responsive on every keystroke, but the recursive `filterTreeByQuery` utility only runs after the user pauses typing. This keeps the implementation easy to reason about while avoiding unnecessary recursive tree work on large vault structures.

## Keyboard Accessibility

The explorer uses a roving focus model:

- `ArrowDown` moves focus to the next visible item.
- `ArrowUp` moves focus to the previous visible item.
- `ArrowRight` expands a focused folder.
- `ArrowLeft` collapses a focused folder. If the focused item is already collapsed or is a file, focus moves to the parent folder.
- `Enter` selects the focused file.
- `Space` toggles or selects the focused row for users who expect button-like behavior.

Only visible rows are included in keyboard movement, so collapsed children are skipped until their parent folder is expanded.

## Wildcard Feature: Breadcrumb Path and Copy Path

The required wildcard feature is a breadcrumb path bar with a copy action. Legal and banking users often need to reference exact file locations in case notes, audit logs, or compliance tickets. Showing the full path and copying it directly reduces the risk of opening, citing, or sending the wrong file path. After copying, the interface confirms the action with a small "Path copied" status message.

## Project Structure

```text
src/
  components/
    FileExplorer/
      BreadcrumbBar.tsx
      EmptyState.tsx
      FileExplorer.tsx
      PropertiesPanel.tsx
      SearchBar.tsx
      TreeNode.tsx
  data/
    data.json
  utils/
    treeUtils.ts
  App.tsx
  main.tsx
  styles.css
docs/
  design-system.md
```

## Future Improvements

- Add file preview support for safe document inspection.
- Add persisted expanded folders and selected files per user session.
- Add role-based permission badges for regulated teams.
- Add virtualized rendering for very large enterprise vaults.
- Add audit logging for file path copies and file selections.
