import React, { useState, useEffect } from "react";

export function RenameCompanyModal({
  isOpen,
  company,
  onClose,
  onSave,
}) {
  const [val, setVal] = useState("");

  useEffect(() => {
    if (company) {
      setVal(company.companyName || "");
    }
  }, [company]);

  if (!isOpen) return null;

  return (
    <div className="fa-modal-overlay" onClick={onClose}>
      <div className="fa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fa-modal-header">
          <span className="fa-modal-title">Rename Company</span>
          <button className="fa-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 6,
              color: "#4a5568",
            }}
          >
            Company Display Name
          </label>
          <input
            type="text"
            className="fa-modal-search"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1.5px solid #e2e8f4",
              borderRadius: 8,
              padding: "8px 10px",
            }}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
          />
        </div>
        <div className="fa-modal-footer">
          <button className="fa-btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="fa-btn-modal-primary"
            onClick={() => {
              if (onSave) onSave(company, val);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
