/**
 * TrialSelectModal — Matches the exact layout, SVGs, styling and card behavior
 * of the vanilla frontend's trialselect.html popup window.
 * Can be rendered as an in-pane modal popup or inside the taskpane view.
 */

function TrialGiftIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="14" rx="2" ry="2"></rect>
      <line x1="12" y1="8" x2="12" y2="22"></line>
      <path d="M19 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2"></path>
      <path d="M5 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2"></path>
      <path d="M15 8H9"></path>
    </svg>
  );
}

function SubscribeStarIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}

export function TrialSelectModal({ onTrial, onPlans, onClose, busy }) {
  return (
    <div className="trial-popup-overlay">
      <div className="trial-popup-dialog">
        {onClose && (
          <button
            className="trial-popup-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        )}

        <div className="trial-select-header" style={{ marginBottom: "24px" }}>
          <h1 className="trial-select-title">Choose Your Plan</h1>
          <p className="trial-select-subtitle">
            Start with a free trial or subscribe to unlock all features.
          </p>
        </div>

        <div className="trial-select-cards">
          {/* Free Trial Card */}
          <div className="trial-select-card">
            <div className="trial-select-icon-box">
              <TrialGiftIcon />
            </div>
            <h2 className="trial-select-card-title">Free Trial</h2>
            <p className="trial-select-card-desc">
              Explore all premium features with a 2-hour free trial for
              QuickBooks &amp; Xero.
            </p>
            <ul className="trial-select-features">
              <li>
                <span className="check">✔</span> Full feature access
              </li>
              <li>
                <span className="check">✔</span> No credit card required
              </li>
              <li>
                <span className="check">✔</span> 2 hours free
              </li>
            </ul>
            <button
              id="btnStartTrial"
              className="btn-trial-action"
              onClick={onTrial}
              disabled={busy}
            >
              {busy ? "Starting…" : "Start Free Trial"}
            </button>
          </div>

          {/* Subscribe Card */}
          <div className="trial-select-card">
            <div className="trial-select-icon-box">
              <SubscribeStarIcon />
            </div>
            <h2 className="trial-select-card-title">Subscribe</h2>
            <p className="trial-select-card-desc">
              Choose a plan that fits your business needs.
            </p>
            <ul className="trial-select-features">
              <li>
                <span className="check">✔</span> All premium features
              </li>
              <li>
                <span className="check">✔</span> Priority support
              </li>
              <li>
                <span className="check">✔</span> Scalable for teams
              </li>
            </ul>
            <button
              id="btnViewPlans"
              className="btn-trial-action"
              onClick={onPlans}
            >
              View Plans &amp; Subscribe
            </button>
          </div>
        </div>

        <div className="trial-select-secure" style={{ marginTop: "24px" }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Secure and encrypted
        </div>
      </div>
    </div>
  );
}
