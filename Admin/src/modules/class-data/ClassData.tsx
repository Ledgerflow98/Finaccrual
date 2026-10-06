
export default function ClassData() {
  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <div>
          <h1>Class Data</h1>
          <p className="subtitle">Manage academic classes, schedules, and enrollments.</p>
        </div>
        <button className="btn-primary">Add Class</button>
      </header>
      
      <div className="glass-card full-width">
        <div className="empty-state">
          <div className="empty-icon">🏫</div>
          <h3>No classes found</h3>
          <p>Add a new class to begin organizing schedules.</p>
        </div>
      </div>
    </div>
  );
}
