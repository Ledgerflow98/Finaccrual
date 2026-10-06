/**
 * AccountPicker — modal overlay replicating the vanilla frontend's
 * accountpicker.html dialog. Shows saved accounts and an "Add account" row.
 */

const avatarColors = [
  "linear-gradient(135deg, #2459dd, #7c5cfc)",
  "linear-gradient(135deg, #e8a020, #f5c040)",
  "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  "linear-gradient(135deg, #22b14c, #16a34a)",
  "linear-gradient(135deg, #ef4444, #f97316)",
];

function initial(name) {
  return (name || "A").trim().charAt(0).toUpperCase();
}

export function AccountPicker({
  accounts,
  onSelectAccount,
  onAddAccount,
  onClose,
}) {
  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ap-header">
          <h2 className="ap-tenant">FINACCRUAL CUSTOMERS</h2>
          <h1 className="ap-title">Pick an account</h1>
          <p className="ap-subtitle">Sign in to access FinAccrual Customers</p>
        </div>

        {/* Account list */}
        <div className="ap-accounts">
          {accounts.map((acc, idx) => (
            <button
              key={acc.email}
              className="ap-row"
              onClick={() => onSelectAccount(acc)}
            >
              <span
                className="ap-avatar"
                style={{ background: avatarColors[idx % avatarColors.length] }}
              >
                {initial(acc.name || acc.email)}
              </span>
              <span className="ap-details">
                <span className="ap-name">{acc.name || acc.email}</span>
                <span className="ap-email">{acc.email}</span>
              </span>
            </button>
          ))}

          {/* Add account row */}
          <button className="ap-row ap-add-row" onClick={onAddAccount}>
            <span className="ap-avatar ap-add-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#444"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="ap-details">
              <span className="ap-name ap-add-label">Add account</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
