/**
 * Renders floating toast notifications in the top-right corner.
 * Compatible with vanilla frontend fa-notif-toast design and CSS classes.
 *
 * Each toast object:
 * {
 *   id: string | number,
 *   title: string,
 *   detail?: string,
 *   type: "success" | "error",
 *   hiding?: boolean
 * }
 */
export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="notifToastContainer" className="fa-notif-toast-container">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            className={`fa-notif-toast fa-notif-toast-${isError ? "error" : "success"}${
              toast.hiding ? " fa-notif-toast-hide" : ""
            }`}
          >
            <span className="fa-notif-toast-icon">
              {isError ? "✕" : "✓"}
            </span>
            <div className="fa-notif-toast-body">
              <div className="fa-notif-toast-title">{toast.title}</div>
              {toast.detail && (
                <div className="fa-notif-toast-detail">{toast.detail}</div>
              )}
            </div>
            <button
              className="fa-notif-toast-close"
              aria-label="Close"
              onClick={() => onDismiss(toast.id)}
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
