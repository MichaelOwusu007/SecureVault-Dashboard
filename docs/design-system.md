# SecureVault Design System

SecureVault uses a dark enterprise interface tuned for fast scanning, keyboard use, and high-confidence file inspection in legal and banking workflows.

## Typography Scale

The type stack is `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`.

| Token | Size | Weight | Usage |
| --- | --- | --- | --- |
| Display | 1.35rem | 700 | Product title in the top bar |
| Section title | 1.05rem | 700 | Explorer and properties panel titles |
| Body | 1rem | 400 | Standard readable text |
| Tree row | 0.93rem | 500 | File and folder names |
| Metadata | 0.86rem | 400 | Long paths and property values |
| Label | 0.72rem | 800 | Eyebrows, metadata keys, badges |

All text uses `letter-spacing: 0` for precision and predictable layout. Long filenames and paths use ellipsis or wrapping depending on context.

## Dark Cyber-Security Color Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Background | `#070b0c` | App canvas |
| Surface | `#0e1517` | Primary panels |
| Raised surface | `#121c1f` | Pills, controls, property blocks |
| Active surface | `#13282a` | Selected and expanded affordances |
| Border | `#223336` | Panel and row boundaries |
| Strong border | `#35545a` | Secondary emphasis |
| Text | `#e7f5f2` | Primary copy |
| Muted text | `#93a9aa` | Secondary metadata |
| Secure accent | `#00e6b0` | Path, focus, protected status |
| Analysis blue | `#58a6ff` | File cues and hover detail |
| Evidence amber | `#ffd166` | Folder cues and search highlights |
| Risk red | `#ff5c7a` | Empty or warning states |

## Spacing Grid

The layout follows a 4px base grid.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | 4px | Small internal gaps |
| `--space-2` | 8px | Icon/text spacing |
| `--space-3` | 12px | Compact padding |
| `--space-4` | 16px | Form and mobile spacing |
| `--space-5` | 20px | Panel padding |
| `--space-6` | 24px | Page rhythm |
| `--space-8` | 32px | Desktop page padding |

Panels and controls use an 8px maximum radius to keep the product precise rather than playful.

## Component States

| State | Behavior |
| --- | --- |
| Default | Dark surface, muted text, subtle border for clear structure |
| Hover | Blue-tinted row background and border to signal interactivity |
| Selected | Secure green accent line with stronger contrast for the active file |
| Focused | 2px secure green focus ring or inset highlight for keyboard users |
| Expanded | Disclosure indicator rotates 90 degrees and child group renders below |
| Collapsed | Disclosure returns to the default direction and child group is removed from the DOM |
| Disabled | Copy path button becomes muted and non-interactive until a file is selected |

## Dashboard Components

Summary cards use compact KPI formatting for vault totals, storage, and file type coverage. File icons use extension-specific color tokens so users can distinguish PDFs, DOCX, XLSX, PNG, folders, and supporting files while scanning the tree. The command help panel is fixed to the lower-right viewport edge and uses real buttons that trigger the same tree commands as keyboard input.

## Accessibility Notes

The explorer follows a tree pattern with `role="tree"`, recursive `role="treeitem"` nodes, `aria-expanded` on folders, `aria-selected` on selectable rows, roving `tabIndex`, and keyboard support for arrow navigation. Focus states are intentionally visible because this dashboard is designed for power users who may work without a mouse.
