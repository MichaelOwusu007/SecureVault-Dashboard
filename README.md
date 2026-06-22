# SecureVault Dashboard

## Project Overview

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

## Live Demo

[View Live SecureVault Dashboard](https://secure-vault-dashboard-ten.vercel.app/)

## Design Deliverable

- [Design Documentation PDF in Repository](./docs/SecureVault-Design-Documentation.pdf)
- [Live Design Documentation PDF](https://secure-vault-dashboard-ten.vercel.app/SecureVault-Design-Documentation.pdf)


The design PDF documents the implemented UI and includes:

- Project overview
- Design direction
- Design system
- Typography scale
- Dark and light color palettes
- Spacing grid
- Component states
- Dashboard frames
- Main components
- Interaction notes
- Accessibility notes

## Data Source

The app uses the provided `data.json` structure exactly: every node keeps its `id`, `name`, `type`, optional `children`, and optional `size` fields. A matching copy lives at `src/data/data.json` so Vite can import it directly from the application source without changing the JSON shape.

## Features

- Recursive file and folder tree using the provided `data.json` structure
- Extension-aware icons for folders, PDF, DOCX, XLSX, PNG, and supporting file types
- Vault summary KPI cards for total files, folders, storage used, and file type coverage
- Expand and collapse folders on click
- File selection with a clear selected state
- Right-side properties panel with name, type, size, and full path
- Keyboard navigation with ArrowUp, ArrowDown, ArrowRight, ArrowLeft, and Enter
- Fixed command help panel with clickable controls for navigate, expand, collapse, and select
- Accessible tree roles and states with `role="tree"`, `role="treeitem"`, `aria-expanded`, and `aria-selected`
- Breadcrumb path bar for the selected file
- Copy path button with a "Path copied" confirmation
- Frontend-only Import to Vault, rename, Move to Trash, Restore, and Delete Permanently actions
- Custom right-click Vault Context Actions for copy, paste, rename, path copy, and destination selection
- Folder selection for choosing an import destination
- Custom confirmation modals and toast notifications without external libraries
- Top-right theme toggle with dark mode as the default product theme
- Search and filter across folders and files
- 300ms debounced search input to avoid recursive filtering on every keystroke
- Deep search results automatically reveal parent folders
- Responsive layout for desktop, tablet, and mobile

## Recursive Strategy

The explorer is powered by `TreeNode.tsx`, a recursive component. Each `TreeNode` renders one file or folder. When the node is a folder and its `id` exists in the expanded set, the component maps over `children` and renders more `TreeNode` instances. Because each level repeats the same component contract, the tree can handle two levels or twenty levels without special-case layout logic.

Tree utilities in `src/utils/treeUtils.ts` keep the data work separate from rendering. They flatten only the currently visible nodes for keyboard navigation, find a selected file path by walking the tree, count files and folders for the dashboard summary, and filter the tree for search while preserving the original JSON shape.

## Search Strategy

The search input uses two pieces of state: the immediate input value and a 300ms debounced query. The input stays responsive on every keystroke, but the recursive `filterTreeByQuery` utility only runs after the user pauses typing. This keeps the implementation easy to reason about while avoiding unnecessary recursive tree work on large vault structures.

## Visual Inspection Strategy

The dashboard includes a KPI strip at the top so reviewers can immediately understand vault scale before interacting with the tree. File and folder icons are generated from the node type or file extension, making PDFs, spreadsheets, documents, images, and folders visually distinct without changing the provided JSON structure.

## Keyboard Accessibility

The explorer uses a roving focus model:

- `ArrowDown` moves focus to the next visible item.
- `ArrowUp` moves focus to the previous visible item.
- `ArrowRight` expands a focused folder.
- `ArrowLeft` collapses a focused folder. If the focused item is already collapsed or is a file, focus moves to the parent folder.
- `Enter` selects the focused file.
- `Space` toggles or selects the focused row for users who expect button-like behavior.

Only visible rows are included in keyboard movement, so collapsed children are skipped until their parent folder is expanded.

The fixed command help panel in the lower-right corner calls the same navigation commands as the keyboard. This makes the shortcuts discoverable while also giving reviewers a clickable way to test focus movement, expansion, collapse, and file selection.

## Wildcard Feature: Breadcrumb Path and Copy Path

The required wildcard feature is a breadcrumb path bar with a copy action. Legal and banking users often need to reference exact file locations in case notes, audit logs, or compliance tickets. Showing the full path and copying it directly reduces the risk of opening, citing, or sending the wrong file path. After copying, the interface confirms the action with a small "Path copied" status message.

## Frontend-Only File Actions

The Vault File Actions feature is intentionally frontend-only. `Import to Vault` opens the browser file picker with a hidden `<input type="file" />`, reads safe browser-provided metadata such as file name, MIME type, size, and last modified date, then stores the imported file in React state.

Browsers do not expose the user's real local computer path for security reasons, so the app never attempts to read paths like `C:/Users/...`. Instead, SecureVault generates its own internal vault path based on the selected folder. For example, importing `NDA-final.pdf` into `SecureVault / Legal Cases / 2026 / Contracts` creates the internal path `/SecureVault/Legal Cases/2026/Contracts/NDA-final.pdf`.

Move to Trash, Restore, Rename, and Delete Permanently are also simulated with React state. Moved files are removed from the active tree and stored in a Trash panel with their original internal path so they can be restored. Permanent deletion removes the file from the frontend demo state. In production, these actions would connect to a secure backend API, authorization checks, audit logging, durable object storage, and a database.

## Vault Context Actions

Vault Context Actions add a custom right-click menu to files and folders without using the browser's default context menu. File actions include Copy, Rename, Copy Path, Move to Trash, and Delete Permanently. Folder actions include Copy Folder, Paste Here, Rename Folder, Copy Path, and Set as Import Destination.

Copy, paste, rename, and path recalculation are frontend-only simulations of real file explorer behavior. Copied files or folders are kept in temporary React state, and Paste Here duplicates the copied item into the target folder with new unique IDs for the pasted node and every nested child. The app does not store physical file-system paths; it recalculates SecureVault internal paths from the current recursive tree, so renamed folders and pasted folder children automatically resolve to their new vault location.

## Project Structure

```text
src/
  components/
    FileExplorer/
      BreadcrumbBar.tsx
      ConfirmationModal.tsx
      EmptyState.tsx
      FileExplorer.tsx
      PropertiesPanel.tsx
      SearchBar.tsx
      ToastContainer.tsx
      TreeNode.tsx
      TrashPanel.tsx
  data/
    data.json
  utils/
    treeUtils.ts
  App.tsx
  main.tsx
  styles.css
docs/
  SecureVault-Design-Documentation.pdf
  design-system.md
public/
  SecureVault-Design-Documentation.pdf
```

## Future Improvements

- Add file preview support for safe document inspection.
- Add persisted expanded folders and selected files per user session.
- Add role-based permission badges for regulated teams.
- Add virtualized rendering for very large enterprise vaults.
- Add audit logging for file path copies and file selections.
