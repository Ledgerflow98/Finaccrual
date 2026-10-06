import React from "react";
import { isTokenExpired } from "../taskpane/api";

export function TrialExpiredModal({ onUpgrade, onClose, onLogout }) {
  const handleUpgrade = () => {
    const token = localStorage.getItem("fa_jwt_token");
    if (!token || isTokenExpired(token)) {
      if (onLogout) {
        onLogout();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fa_session_expired"));
      }
      return;
    }
    if (onUpgrade) onUpgrade();
  };

  return (
    <div
      className="fa-modal-overlay"
      id="trialExpiredModal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 20, 40, 0.65)",
        backdropFilter: "blur(2px)",
        padding: "16px",
        boxSizing: "border-box"
      }}
    >
      <div
        className="fa-modal"
        style={{
          maxWidth: "320px",
          width: "88%",
          textAlign: "center",
          padding: "20px 18px",
          borderRadius: "14px",
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          position: "relative",
          boxSizing: "border-box",
          animation: "apSlideUp 0.22s ease"
        }}
      >
        {onClose && (
          <button
            id="btnCloseTrialExpired"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "12px",
              background: "none",
              border: "none",
              fontSize: "20px",
              lineHeight: 1,
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px"
            }}
            aria-label="Close"
          >
            &times;
          </button>
        )}

        <div className="trial-expired-icon" style={{ marginBottom: "10px" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            style={{ width: "64px", height: "64px", margin: "0 auto", display: "block" }}
          >
            <circle cx="50" cy="50" r="40" fill="#f3f4f6" />
            <rect x="35" y="30" width="30" height="40" rx="4" fill="#e2e8f0" />
            <circle cx="60" cy="65" r="20" fill="#8b5cf6" />
            <path
              d="M60 55v10l8 5"
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="65" cy="25" r="10" fill="#f59e0b" />
            <path
              d="M65 20v5m0 3v1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "17px",
            fontWeight: 700,
            color: "#172b56",
            fontFamily: "inherit"
          }}
        >
          Free Trial Completed!
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "12.5px",
            marginBottom: "16px",
            lineHeight: "1.4",
            fontFamily: "inherit"
          }}
        >
          Your free trial has ended. Upgrade your plan
          <br />
          to continue using <strong>FinAccrual</strong> and unlock all features.
        </p>

        <button
          id="btnUpgradeNow"
          className="fa-btn-primary"
          onClick={handleUpgrade}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            backgroundColor: "#6300ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 12px rgba(99, 0, 255, 0.25)"
          }}
        >
          <span style={{ color: "#fcd34d" }}>👑</span> Upgrade Now
        </button>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "11px",
            marginTop: "10px",
            marginBottom: "0",
            fontFamily: "inherit"
          }}
        >
          Choose the plan that's right for you.
        </p>

        {onLogout && (
          <button
            type="button"
            id="btnSignOutTrialExpired"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "12px",
              textDecoration: "underline",
              cursor: "pointer",
              marginTop: "10px",
              padding: "4px",
              fontFamily: "inherit"
            }}
          >
            Sign out / Switch account
          </button>
        )}
      </div>
    </div>
  );
}
