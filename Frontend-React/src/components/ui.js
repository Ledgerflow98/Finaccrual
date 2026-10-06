export const initials = (name) => (name || "A").trim().charAt(0).toUpperCase();

export function Header({ title, onBack, user }) {
  return <div className="view-header">
    <div className="view-header-brand">{onBack && <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>}<span className="view-header-title">{title}</span></div>
    {user?.email && <div className="view-header-user"><span className="user-email-sm">{user.email}</span><span className="user-avatar-sm">{initials(user.name)}</span></div>}
  </div>;
}

export function Loading() {
  return <section className="view active"><div className="loading-screen"><div className="loading-logo"><div className="brand-icon">FA</div></div><div className="loading-spinner"/><p className="loading-text">Loading FinAccrual…</p></div></section>;
}

export function Success({ user, order, onContinue }) {
  const planName = order?.name || user?.plan || "Pro";
  const displayPlan = planName.toLowerCase().includes("plan") ? planName : `${planName} Plan`;
  const subId = user?.subscriptionId || localStorage.getItem("fa_subscription_id") || "FA-SUB-202639";
  return (
    <section className="view active">
      <div className="success-screen">
        <div className="success-icon-wrap">
          <div className="success-check">✓</div>
        </div>
        <h2 className="success-title">Account Created!</h2>
        <p className="success-subtitle">Your FinAccrual subscription is now active.</p>

        <div className="success-id-card">
          <p className="success-id-label">Subscription ID</p>
          <div className="success-id-value">{subId}</div>
        </div>

        <div className="success-plan-card">
          <p className="success-plan-label">Plan</p>
          <p className="success-plan-value">{displayPlan}</p>
        </div>

        <button className="success-dashboard-btn" onClick={onContinue}>
          Go to Dashboard →
        </button>
      </div>
    </section>
  );
}
