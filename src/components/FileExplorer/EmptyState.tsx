type EmptyStateProps = {
  query: string;
};

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__mark" aria-hidden="true">
        0
      </div>
      <h3>No vault records found</h3>
      <p>No file or folder matches "{query}". Check the name, extension, or case reference.</p>
    </div>
  );
}
