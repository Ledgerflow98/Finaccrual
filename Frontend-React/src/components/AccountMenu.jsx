import { useEffect, useRef } from "react";
import { initials } from "./ui";

export function AccountMenu({
  user,
  planClean,
  onClose,
  onLogout,
  onChangePlan,
  notify,
}) {
  const menuRef = useRef(null);
  const name = user.name || localStorage.getItem("fa_user_name") || "Sai";
  const email = user.email || localStorage.getItem("fa_user_email") || "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="account-menu-dropdown" ref={menuRef}>
      <div className="dropdown-user-header">
        <div className="dash-avatar-btn dropdown-avatar">{initials(name)}</div>
        <div className="dropdown-user-info">
          <div className="dropdown-user-name">{name}</div>
          <div className="dropdown-user-email">{email}</div>
        </div>
      </div>
      <div className="dropdown-menu-list">
        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            if (notify) notify("Account management is coming soon.", "success", "", undefined, { persist: false });
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Manage Account
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            if (notify) notify("Settings are currently managed via your subscription plan.", "success", "", undefined, { persist: false });
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            if (onChangePlan) {
              onChangePlan();
            } else if (notify) {
              notify(`Your ${planClean || "Pro"} Plan is active.`, "success", "", undefined, { persist: false });
            }
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Plan Details
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            if (onChangePlan) {
              onChangePlan();
            }
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          Change Plan
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            navigator.clipboard?.writeText("support@finaccrual.com").catch(() => {});
            if (notify) notify("Support email (support@finaccrual.com) copied to clipboard.", "success", "", undefined, { persist: false });
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Need Help
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => {
            onClose();
            if (notify) {
              notify(
                "Instructions: Setup Master & Input Sheets, then pull data.",
                "success",
                "",
                undefined,
                { persist: false }
              );
            }
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Instructions
        </button>

        <div className="dropdown-divider"></div>

        <button
          className="dropdown-menu-item text-red"
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          <svg
            className="icon-svg dropdown-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
