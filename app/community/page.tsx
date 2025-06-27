export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-bg-card p-6 text-center">
        <h3 className="mb-3 text-xl font-semibold text-primary">Welcome to the Community Hub</h3>
        <p className="mb-4 text-text-secondary">
          Join discussions, share insights, and connect with fellow members.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-sm text-text-muted">Active Discussions</p>
          </div>
          <div className="rounded-md bg-bg-card p-3 text-center">
            <p className="text-2xl font-bold text-secondary">48</p>
            <p className="text-sm text-text-muted">Community Members</p>
          </div>
          <div className="rounded-md bg-bg-card p-3 text-center">
            <p className="text-2xl font-bold text-accent">156</p>
            <p className="text-sm text-text-muted">Total Comments</p>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg bg-bg-card p-6">
        <h4 className="mb-3 font-medium text-text-secondary">Community Guidelines</h4>
        <ul className="list-disc pl-5 text-sm text-text-muted">
          <li className="mb-1">Be respectful and considerate of other members</li>
          <li className="mb-1">Stay on topic and contribute meaningfully to discussions</li>
          <li className="mb-1">No spam, advertising, or self-promotion</li>
          <li className="mb-1">Respect privacy and confidentiality</li>
        </ul>
      </div>
      
      <div className="text-center text-text-muted">
        Select a thread to view details or start a new discussion.
      </div>
    </div>
  );
}
