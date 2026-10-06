import { useEffect, useRef } from "react";
import { NotificationService } from "../taskpane/services/notificationService";

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return timeStr;
  const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Dropdown drawer that shows persistent notification history,
 * with unread status, timestamps, icons, and a "Clear All" button.
 */
export function NotificationDrawer({
  notifications = [],
  topOffset = "56px",
  onClose,
  onClearAll
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        // If the click was not on the bell button itself, close drawer
        if (!event.target.closest(".fa-notif-bell-btn")) {
          onClose();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const validNotifications = (notifications || []).filter((n) =>
    NotificationService.isNotExpired(n?.timestamp)
  );

  return (
    <div className="fa-notif-drawer-anchor" style={{ zIndex: 10000 }}>
      <div
        className="fa-notif-drawer"
        id="notifDrawer"
        ref={drawerRef}
        style={{ top: topOffset, display: "flex" }}
      >
        <div className="fa-notif-drawer-header">
          <span className="fa-notif-drawer-title">Notifications</span>
          <button
            className="fa-notif-clear-btn"
            id="notifClearAllBtn"
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
          >
            Clear All
          </button>
        </div>
        <div className="fa-notif-list" id="notifList">
          {validNotifications.length === 0 ? (
            <div className="fa-notif-empty">No notifications available.</div>
          ) : (
            validNotifications.map((n) => {
              const isError = n.type === "error";
              return (
                <div
                  key={n.id}
                  className={`fa-notif-item fa-notif-item-${isError ? "error" : "success"}`}
                >
                  <span className="fa-notif-icon">{isError ? "✕" : "✓"}</span>
                  <div className="fa-notif-content">
                    <div className="fa-notif-message">{n.message}</div>
                    {n.detail && <div className="fa-notif-detail">{n.detail}</div>}
                    <div className="fa-notif-time">{formatTimestamp(n.timestamp)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
