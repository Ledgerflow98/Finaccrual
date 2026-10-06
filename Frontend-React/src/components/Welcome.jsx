import { useState } from "react";
import { AccountPicker } from "./AccountPicker";
import { getAccounts } from "../taskpane/accountHistory";

/* Inline Google "G" logo */
function GoogleIcon() {
  return (
    <svg className="fa-google-icon" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09a6.97 6.97 0 0 1 0-4.17V7.07H2.18a11.01 11.01 0 0 0 0 9.86l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* Inline Microsoft four-square logo */
function MicrosoftIcon() {
  return (
    <svg className="fa-ms-icon" viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export function Welcome({ onAuth, busy }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  const handleSignInClick = () => {
    const accounts = getAccounts();
    if (accounts.length > 0) {
      setShowPicker(true);
    } else {
      // No saved accounts — go straight to provider selection
      setShowProviders(true);
    }
  };

  const handleSelectAccount = (account) => {
    setShowPicker(false);
    // Use the account's provider with login_hint so the OAuth screen
    // auto-selects the right account (skips the provider's own chooser)
    onAuth(account.provider || "google", account.email);
  };

  const handleAddAccount = () => {
    setShowPicker(false);
    setShowProviders(true);
  };

  return (
    <section className="view active">
      <main className="fa-welcome">
        <div className="fa-welcome-content">
          <div className="fa-welcome-logo" aria-label="FinAccrual">
            FA
          </div>
          <h1>Welcome to FinAccrual</h1>
          <p className="fa-welcome-tagline">Smart. Accurate. Automated.</p>
          <div className="fa-welcome-divider" aria-hidden="true">
            <span />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3 5 6v5c0 5 3.1 8.5 7 10 3.9-1.5 7-5 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span />
          </div>
          <p className="fa-welcome-copy">
            Sign in to access your data, connect your accounting platforms, and
            automate your workflow.
          </p>

          {/* Primary sign-in button — visible until user picks "Add account" */}
          {!showProviders && (
            <button
              className="fa-welcome-signin"
              disabled={busy}
              onClick={handleSignInClick}
            >
              <span className="fa-welcome-signin-mark">FA</span>
              {busy ? "Signing in…" : "FinAccrual Sign In"}
            </button>
          )}

          {/* Provider buttons — shown after "Add account" or when no saved accounts */}
          {showProviders && (
            <div className="fa-provider-buttons">
              <button
                className="fa-provider-btn"
                disabled={busy}
                onClick={() => onAuth("google")}
              >
                <GoogleIcon />
                {busy === "google" ? "Signing in…" : "Continue with Google"}
              </button>
              <button
                className="fa-provider-btn"
                disabled={busy}
                onClick={() => onAuth("microsoft")}
              >
                <MicrosoftIcon />
                {busy === "microsoft" ? "Signing in…" : "Continue with Microsoft"}
              </button>
            </div>
          )}

          <p className="fa-welcome-security">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>{" "}
            Secure and encrypted
          </p>
        </div>
      </main>

      {/* Account Picker modal */}
      {showPicker && (
        <AccountPicker
          accounts={getAccounts()}
          onSelectAccount={handleSelectAccount}
          onAddAccount={handleAddAccount}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  );
}
