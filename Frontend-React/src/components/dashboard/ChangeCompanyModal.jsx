import React, { useState, useEffect } from "react";

export function ChangeCompanyModal({
  isOpen,
  label,
  platformConns,
  initialCompanyId,
  onClose,
  onSwitchCompany,
  onAddAnotherCompany,
  onReconnectCompany,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(initialCompanyId);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialCompanyId);
      setSearchTerm("");
    }
  }, [isOpen, initialCompanyId]);

  if (!isOpen) return null;

  const filtered = platformConns.filter((c) =>
    (c.companyName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fa-modal-overlay" onClick={onClose}>
      <div className="fa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fa-modal-header">
          <span className="fa-modal-title">Switch {label} Company</span>
          <button className="fa-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="fa-modal-search-wrap">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7a9a"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="fa-modal-search"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="fa-modal-list">
          {filtered.map((c) => {
            const isSelected = c.companyId === selectedId;
            const cIsXero = (c.platform || "").toLowerCase() === "xero";
            const isDisconnected = c.status === "Disconnected";
            const displayName = c.companyName || (cIsXero ? "Xero Organisation" : "QuickBooks Company");

            return (
              <div
                key={c.companyId}
                className={`fa-modal-company-row ${isSelected ? "selected" : ""} ${isDisconnected ? "disconnected" : ""}`}
                onClick={() => setSelectedId(c.companyId)}
              >
                <div className={`fa-company-icon ${cIsXero ? "xero-company-icon" : ""}`}>
                  {cIsXero ? "xero" : "qb"}
                </div>
                <div className="fa-company-info">
                  <div className="fa-company-name">
                    {displayName}
                    {isDisconnected && (
                      <span style={{ color: "#ef4444", fontSize: 10, marginLeft: 4 }}>(Disconnected)</span>
                    )}
                  </div>
                  <div className="fa-company-tag">
                    {cIsXero ? "Tenant ID" : "Realm ID"}: {c.companyId || "—"}
                  </div>
                </div>
                {isDisconnected && onReconnectCompany && (
                  <button
                    className="fa-btn-reconnect"
                    style={{ marginLeft: "auto" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onReconnectCompany(c);
                    }}
                  >
                    Reconnect
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="fa-modal-link-row">
          <span className="fa-modal-link-text">Can't find your company?</span>
          <button
            className="fa-modal-add-link"
            onClick={() => {
              onClose();
              if (onAddAnotherCompany) onAddAnotherCompany();
            }}
          >
            + Add Another Company
          </button>
        </div>
        <div className="fa-modal-footer">
          <button className="fa-btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="fa-btn-modal-primary"
            onClick={() => {
              if (selectedId && onSwitchCompany) {
                onSwitchCompany(selectedId);
              }
              onClose();
            }}
          >
            Switch Company
          </button>
        </div>
      </div>
    </div>
  );
}
