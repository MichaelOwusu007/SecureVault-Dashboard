import { VAULT_ROOT_LABEL, formatFullPath } from "../../utils/treeUtils";

type BreadcrumbBarProps = {
  pathSegments: string[];
  canCopy: boolean;
  copied: boolean;
  onCopy: () => void;
};

export function BreadcrumbBar({ pathSegments, canCopy, copied, onCopy }: BreadcrumbBarProps) {
  const fullPath = formatFullPath(pathSegments);
  const crumbs = pathSegments.length > 0 ? [VAULT_ROOT_LABEL, ...pathSegments] : [VAULT_ROOT_LABEL];

  return (
    <section className="breadcrumb-bar" aria-label="Selected file path">
      <div className="breadcrumb-track" title={pathSegments.length > 0 ? fullPath : "No file selected"}>
        {crumbs.map((crumb, index) => (
          <span className="breadcrumb-item" key={`${crumb}-${index}`}>
            {index > 0 ? <span className="breadcrumb-separator">/</span> : null}
            <span>{crumb}</span>
          </span>
        ))}
      </div>
      <div className="breadcrumb-actions">
        {copied ? (
          <span className="copy-confirmation" role="status">
            Path copied
          </span>
        ) : null}
        <button
          className="copy-button"
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          aria-label={canCopy ? "Copy selected file path" : "Select a file to copy its path"}
        >
          <span className="copy-button__icon" aria-hidden="true" />
          Copy path
        </button>
      </div>
    </section>
  );
}
