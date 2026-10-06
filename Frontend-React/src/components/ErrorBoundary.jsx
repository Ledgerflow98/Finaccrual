import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("FinAccrual Add-in Uncaught Error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="view active" style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", padding: "24px", background: "#f8fafc" }}>
          <div style={{ maxWidth: "340px", textAlign: "center", background: "#ffffff", padding: "28px 20px", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "20px", fontWeight: "bold" }}>
              ⚠
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px", lineHeight: "1.5" }}>
              An unexpected error occurred in the add-in. You can reload the taskpane to resume your session.
            </p>
            {this.state.error && (
              <div style={{ background: "#f1f5f9", padding: "8px 10px", borderRadius: "6px", fontSize: "11px", color: "#475569", textAlign: "left", marginBottom: "18px", maxHeight: "80px", overflowY: "auto", fontFamily: "monospace" }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReload}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "#2459dd",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Reload Taskpane
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
