import React, { useEffect } from "react";

export function CompanyContextMenu({
  visible,
  x,
  y,
  company,
  onDisconnect,
  onClose,
}) {
  useEffect(() => {
    const handleClick = () => {
      if (visible) onClose();
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [visible, onClose]);

  const isDisconnected =
    company?.status === "Disconnected" ||
    (typeof company?.status === "string" &&
      company.status.toLowerCase() === "disconnected");

  if (!visible || isDisconnected) return null;

  return (
    <div
      className="fa-context-menu"
      style={{
        display: "block",
        top: y,
        left: x,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="fa-context-item danger"
        onClick={() => {
          onClose();
          if (company) onDisconnect(company);
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
