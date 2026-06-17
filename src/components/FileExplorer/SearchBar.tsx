type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
};

export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="sr-only" htmlFor="vault-search">
        Search files and folders
      </label>
      <span className="search-icon" aria-hidden="true" />
      <input
        id="vault-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search files, folders, evidence..."
        autoComplete="off"
        aria-controls="securevault-folder-tree"
      />
      {value.trim() ? (
        <span className="search-count" aria-live="polite">
          {resultCount} visible
        </span>
      ) : null}
    </div>
  );
}
