import { KeyboardEvent } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
};

export function SearchBar({ value, onChange, onEnter }: SearchBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    }
  };

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
        onKeyDown={handleKeyDown}
        placeholder="Search files, folders, evidence..."
        autoComplete="off"
        aria-controls="securevault-folder-tree"
      />
    </div>
  );
}
