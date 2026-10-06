import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../taskpane/api";

/**
 * GlobalErrorBanner
 * Handles two critical connection failure modes:
 * 1. Wi-Fi / Internet is Off -> "Error: Please check your Internet connection"
 * 2. Backend Server is Off -> "503 Service Unavailable : ERR_CONNECTION_REFUSED"
 *
 * Intercepts clicks on other buttons while active, provides a "Retry" button,
 * and flashes the banner when blocked clicks occur.
 */
export function GlobalErrorBanner({ onBannerChange }) {
  const [banner, setBanner] = useState(null);
  const [flashing, setFlashing] = useState(false);
  const [checking, setChecking] = useState(false);
  const flashTimerRef = useRef(null);
  const isCheckingRef = useRef(false);

  const triggerFlash = useCallback(() => {
    setFlashing(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlashing(false);
    }, 400);
  }, []);

  const updateBanner = useCallback(
    (newBanner) => {
      setBanner(newBanner);
      if (typeof window !== "undefined") {
        window._faGlobalBannerActive = !!newBanner;
        window._faIsOffline = !!newBanner;
      }
      if (onBannerChange) {
        onBannerChange(!!newBanner);
      }
    },
    [onBannerChange]
  );

  const checkConnectivity = useCallback(async () => {
    if (isCheckingRef.current) return false;
    isCheckingRef.current = true;
    setChecking(true);

    try {
      // Stage 1: Browser navigator check
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateBanner({
          type: "offline",
          message: "Please check your Internet connection",
          actionLabel: "Retry",
        });
        triggerFlash();
        return false;
      }

      // Stage 2: Verify real internet access beyond local loopback
      let internetAlive = false;
      try {
        const controller =
          typeof AbortController !== "undefined" ? new AbortController() : null;
        const timeoutId = controller
          ? setTimeout(() => controller.abort(), 2500)
          : null;
        await fetch("https://www.gstatic.com/generate_204", {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          signal: controller ? controller.signal : undefined,
        });
        if (timeoutId) clearTimeout(timeoutId);
        internetAlive = true;
      } catch (_) {
        internetAlive = false;
      }

      if (!internetAlive) {
        updateBanner({
          type: "offline",
          message: "Please check your Internet connection",
          actionLabel: "Retry",
        });
        triggerFlash();
        return false;
      }

      // Stage 3: Ping backend health endpoint
      try {
        const controller =
          typeof AbortController !== "undefined" ? new AbortController() : null;
        const timeoutId = controller
          ? setTimeout(() => controller.abort(), 3000)
          : null;
        const res = await fetch(`${API_BASE}/api/health`, {
          method: "GET",
          cache: "no-store",
          signal: controller ? controller.signal : undefined,
        });
        if (timeoutId) clearTimeout(timeoutId);

        if (res) {
          // Backend is alive and responding!
          updateBanner(null);
          return true;
        }
      } catch (_) {
        // Backend server is down or refused connection
        updateBanner({
          type: "backend_down",
          message: "Offline : Cannot connect to server",
          actionLabel: "Retry",
        });
        triggerFlash();
        return false;
      }

      // If backend responded, backend is reachable
      updateBanner(null);
      return true;
    } finally {
      isCheckingRef.current = false;
      setChecking(false);
    }
  }, [updateBanner, triggerFlash]);

  // Synchronous capture-phase click interceptor
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const bannerEl = document.getElementById("faGlobalBanner");
      const targetBtn = e.target.closest(
        "button, a, select, input, [role='button'], .fa-company-row, .fa-modal-company-row, .erp-card-large, .conn-journal-btn, .btn-connect-full, .btn-disconnect-company, .fa-disconnect-btn, .action-card, .fa-welcome-signin, .fa-provider-btn"
      );

      if (!targetBtn) return;

      // Allow clicks on the Retry button inside the banner itself!
      if (bannerEl && bannerEl.contains(targetBtn)) {
        return;
      }

      // 1. If banner is already active, block all clicks and flash
      if (banner || window._faGlobalBannerActive) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") {
          e.stopImmediatePropagation();
        }
        triggerFlash();
        if (!isCheckingRef.current) {
          checkConnectivity();
        }
        return false;
      }

      // 2. If navigator reports offline right now, immediately block and display the offline banner!
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") {
          e.stopImmediatePropagation();
        }
        updateBanner({
          type: "offline",
          message: "Please check your Internet connection",
          actionLabel: "Retry",
        });
        triggerFlash();
        return false;
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [banner, triggerFlash, checkConnectivity, updateBanner]);

  // Real-time network and backend status listeners
  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      updateBanner({
        type: "offline",
        message: "Please check your Internet connection",
        actionLabel: "Retry",
      });
      triggerFlash();
    };

    const handleNetworkOffline = () => {
      updateBanner({
        type: "offline",
        message: "Please check your Internet connection",
        actionLabel: "Retry",
      });
      triggerFlash();
    };

    const handleBackendOffline = () => {
      updateBanner({
        type: "backend_down",
        message: "Offline : Cannot connect to server",
        actionLabel: "Retry",
      });
      triggerFlash();
    };

    const handleBackendOnline = () => {
      setBanner((prev) => {
        if (prev?.type === "backend_down") {
          if (typeof window !== "undefined") {
            window._faGlobalBannerActive = false;
            window._faIsOffline = false;
          }
          if (onBannerChange) onBannerChange(false);
          return null;
        }
        return prev;
      });
    };

    const handleFocusCheck = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateBanner({
          type: "offline",
          message: "Please check your Internet connection",
          actionLabel: "Retry",
        });
        triggerFlash();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("fa_network_offline", handleNetworkOffline);
    window.addEventListener("fa_backend_offline", handleBackendOffline);
    window.addEventListener("fa_backend_online", handleBackendOnline);
    window.addEventListener("focus", handleFocusCheck);
    document.addEventListener("visibilitychange", handleFocusCheck);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("fa_network_offline", handleNetworkOffline);
      window.removeEventListener("fa_backend_offline", handleBackendOffline);
      window.removeEventListener("fa_backend_online", handleBackendOnline);
      window.removeEventListener("focus", handleFocusCheck);
      document.removeEventListener("visibilitychange", handleFocusCheck);
    };
  }, [banner, updateBanner, triggerFlash, checkConnectivity, onBannerChange]);

  if (!banner) return null;

  return (
    <div
      id="faGlobalBanner"
      className={`fa-global-banner fa-global-banner-offline ${
        flashing ? "fa-banner-flash" : ""
      }`}
      style={{ display: "flex" }}
    >
      <span className="fa-global-banner-icon" aria-hidden="true">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#be123c"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <span className="fa-global-banner-message" id="faGlobalBannerMessage">
        {banner.message}
      </span>
      {banner.actionLabel && (
        <button
          className="fa-global-banner-action"
          id="faGlobalBannerAction"
          onClick={() => checkConnectivity()}
          disabled={checking}
        >
          {checking ? "Checking..." : banner.actionLabel}
        </button>
      )}
    </div>
  );
}
