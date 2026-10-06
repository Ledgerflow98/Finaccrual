function TrialIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 8v12M4 12h16M12 8H8.5a2.5 2.5 0 1 1 2.5-2.5V8Zm0 0h3.5A2.5 2.5 0 1 0 13 5.5V8Z" />
    </svg>
  );
}

function SubscribeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.55 5.16 5.7.83-4.13 4.03.98 5.68L12 16.02 6.9 18.7l.98-5.68-4.13-4.03 5.7-.83L12 3Z" />
    </svg>
  );
}

export function TrialSelect({ onTrial, onPlans, busy }) {
  return (
    <section className="view active">
      <main className="fa-trial-select">
        <header className="fa-trial-select-header">
          <h1>Choose Your Plan</h1>
          <p>Start with a free trial or subscribe to unlock all features.</p>
        </header>
        <div className="fa-trial-select-cards">
          <article className="fa-trial-plan fa-trial-plan-selected">
            <div className="fa-trial-plan-icon">
              <TrialIcon />
            </div>
            <h2>Free Trial</h2>
            <p className="fa-trial-plan-description">
              Explore all premium features with a 2-hour free trial for
              QuickBooks &amp; Xero.
            </p>
            <ul>
              <li>Full feature access</li>
              <li>No credit card required</li>
              <li>2 hours free</li>
            </ul>
            <button onClick={onTrial} disabled={busy}>
              {busy ? "Starting…" : "Start Free Trial"}
            </button>
          </article>
          <article className="fa-trial-plan">
            <div className="fa-trial-plan-icon">
              <SubscribeIcon />
            </div>
            <h2>Subscribe</h2>
            <p className="fa-trial-plan-description">
              Choose a plan that fits your business needs.
            </p>
            <ul>
              <li>All premium features</li>
              <li>Priority support</li>
              <li>Scalable for teams</li>
            </ul>
            <button onClick={onPlans}>View Plans &amp; Subscribe</button>
          </article>
        </div>
      </main>
    </section>
  );
}
