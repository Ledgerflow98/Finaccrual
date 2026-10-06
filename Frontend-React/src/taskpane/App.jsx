import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { Payment } from "../components/Payment";
import { Plans } from "../components/Plans";
import { TrialSelect } from "../components/TrialSelect";
import { TrialSelectModal } from "../components/TrialSelectModal";
import { TrialExpiredModal } from "../components/TrialExpiredModal";
import { Welcome } from "../components/Welcome";
import { Loading, Success } from "../components/ui";
import { ToastContainer } from "../components/ToastContainer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { GlobalErrorBanner } from "../components/GlobalErrorBanner";
import { NotificationService } from "./services/notificationService";
import { ExcelService } from "./services/excelService";
import { apiFetch, openAuth, openErp, openTrialSelectDialog, isTrustedOrigin, isTokenExpired } from "./api";
import { saveAccount } from "./accountHistory";

const initialUser = () => ({
  name: localStorage.getItem("fa_user_name") || "",
  email: localStorage.getItem("fa_user_email") || "",
  plan: localStorage.getItem("fa_plan") || localStorage.getItem("fa_subscription_plan") || "",
  subscriptionId: localStorage.getItem("fa_subscription_id") || ""
});

export function App() {
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(initialUser);
  const [order, setOrder] = useState(null);
  const orderRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTop, setDrawerTop] = useState("56px");
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasGlobalBanner, setHasGlobalBanner] = useState(false);
  const hasNotifiedSessionExpiredRef = useRef(false);

  // Fetch notifications history when user email is available
  const loadNotifications = useCallback(async () => {
    const list = await NotificationService.fetchNotifications();
    setNotifications(NotificationService.filterValid(list));
  }, []);

  useEffect(() => {
    if (user.email) {
      loadNotifications();
    }
  }, [user.email, loadNotifications]);

  // Real-time eviction of notifications exceeding 24 hours while the add-in remains open
  useEffect(() => {
    if (!user.email) return;
    const interval = setInterval(() => {
      setNotifications((prev) => {
        const valid = NotificationService.filterValid(prev);
        return valid.length === prev.length ? prev : valid;
      });
    }, 60 * 1000); // Check every minute for real-time eviction
    return () => clearInterval(interval);
  }, [user.email]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hiding: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  // Universal notify / showStatus function
  // Signature: notify(titleOrMessage, type, detail, provider, options)
  const notify = useCallback(
    (titleOrMessage, type = "success", detail = "", provider = undefined, options = {}) => {
      if (!titleOrMessage) return;

      // Detect error from title if not explicitly passed
      let resolvedType = type;
      if (
        type === "success" &&
        (/error|fail|failed|unable|denied|invalid|rejected/i.test(titleOrMessage))
      ) {
        resolvedType = "error";
      }

      // If global error banner is active, suppress repetitive error toasts so single fixed notification is shown
      if (
        typeof window !== "undefined" &&
        window._faGlobalBannerActive &&
        (resolvedType === "error" || /503|refused|offline|internet|connection/i.test(titleOrMessage))
      ) {
        return;
      }

      const id = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const newToast = {
        id,
        title: String(titleOrMessage),
        detail: detail ? String(detail) : "",
        type: resolvedType === "error" ? "error" : "success",
        hiding: false
      };

      // Add to floating toasts (stack up to 4 toasts)
      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      // Auto dismiss toast after 4500ms
      setTimeout(() => {
        dismissToast(id);
      }, 4500);

      const shouldPersist = options?.persist !== false && !options?.toastOnly;
      const token = localStorage.getItem("fa_jwt_token");
      const hasValidToken = token && !isTokenExpired(token);

      // Persist notification to backend & history only when requested and authenticated
      if (shouldPersist && hasValidToken) {
        const tempNotif = {
          id,
          type: resolvedType === "error" ? "error" : "success",
          message: String(titleOrMessage),
          detail: detail ? String(detail) : "",
          provider: provider || null,
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications((prev) =>
          NotificationService.filterValid([tempNotif, ...prev]).slice(0, NotificationService.MAX_ITEMS)
        );

        NotificationService.postNotification(
          resolvedType,
          titleOrMessage,
          detail,
          provider
        ).then((saved) => {
          if (saved) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? saved : n))
            );
          }
        });
      }
    },
    [dismissToast]
  );

  const currentErpType = (localStorage.getItem("fa_erp_type") || "").toLowerCase();
  const isErpConnected = localStorage.getItem("fa_erp_connected") === "true";

  const visibleNotifications = useMemo(() => {
    const valid = NotificationService.filterValid(notifications);
    return valid.filter((n) => {
      if (!n.provider) return true;
      if (!isErpConnected || !currentErpType) return true;
      return n.provider.toLowerCase() === currentErpType;
    });
  }, [notifications, isErpConnected, currentErpType]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n) => !n.read).length;
  }, [visibleNotifications]);

  const toggleDrawer = useCallback((top = "56px") => {
    setDrawerTop(top);
    setDrawerOpen((prev) => {
      const next = !prev;
      if (next) {
        // Immediately mark all visible unread notifications as read so badge count is 0 instantly
        setNotifications((prevNotifs) => {
          const valid = NotificationService.filterValid(prevNotifs);
          const unreadIds = valid.filter((n) => !n.read).map((n) => n.id);
          if (unreadIds.length > 0) {
            NotificationService.markRead(unreadIds).catch(() => {});
          }
          return valid.map((n) => ({ ...n, read: true }));
        });
      }
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(async (providerToClear) => {
    const ok = await NotificationService.clearAll(providerToClear);
    if (ok) {
      if (providerToClear) {
        setNotifications((prev) =>
          prev.filter((n) => n.provider && n.provider.toLowerCase() !== providerToClear.toLowerCase())
        );
      } else {
        setNotifications([]);
      }
      setDrawerOpen(false);
    } else {
      notify("Couldn't clear notifications. Please try again.", "error");
    }
  }, [notify]);

  // Keep orderRef in sync so asynchronous message callbacks can always read the latest selected plan
  useEffect(() => { orderRef.current = order; }, [order]);

  const logout = useCallback(() => {
    [
      "fa_user_name", "fa_user_email", "fa_plan", "fa_subscription_plan",
      "fa_subscription_id", "fa_jwt_token", "fa_refresh_token",
      "fa_erp_connected", "fa_erp_type", "fa_current_company_id", "fa_has_subscription",
      "fa_trial_ends_at", "fa_trial_start", "fa_step_setup", "fa_step_pull"
    ].forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem("fa_erp_user_disconnected");
    setUser({});
    setNotifications([]);
    setShowTrialPopup(false);
    setShowTrialExpired(false);
    ExcelService.clearMasterData().catch(() => {});
    setView("welcome");
  }, []);

  // Global session expiration handler (e.g. 401 from backend or expired JWT)
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      if (!hasNotifiedSessionExpiredRef.current) {
        hasNotifiedSessionExpiredRef.current = true;
        notify("Your session has expired. Please sign in again.", "error");
      }
    };
    window.addEventListener("fa_session_expired", handleSessionExpired);
    return () => window.removeEventListener("fa_session_expired", handleSessionExpired);
  }, [logout, notify]);

  // Session bootstrap & backend sync
  useEffect(() => {
    let mounted = true;
    async function initSession() {
      const email = localStorage.getItem("fa_user_email");
      const token = localStorage.getItem("fa_jwt_token");
      if (!email || !token) {
        if (mounted) setView("welcome");
        return;
      }
      if (isTokenExpired(token)) {
        if (mounted) {
          logout();
          if (!hasNotifiedSessionExpiredRef.current) {
            hasNotifiedSessionExpiredRef.current = true;
            notify("Your session has expired. Please sign in again.", "error");
          }
        }
        return;
      }

      try {
        const res = await apiFetch("/api/auth/me");
        const data = await res.json();
        if (mounted && data?.user) {
          hasNotifiedSessionExpiredRef.current = false;
          const serverPlan = data.user.plan || localStorage.getItem("fa_plan") || localStorage.getItem("fa_subscription_plan") || "";
          const serverSubId = data.user.subscriptionId || localStorage.getItem("fa_subscription_id") || "";
          if (serverPlan) {
            localStorage.setItem("fa_plan", serverPlan);
            localStorage.setItem("fa_subscription_plan", serverPlan);
          }
          if (serverSubId) {
            localStorage.setItem("fa_subscription_id", serverSubId);
          }
          if (data.user.trialEndsAt) {
            const trialEnds = new Date(data.user.trialEndsAt).getTime();
            localStorage.setItem("fa_trial_ends_at", String(trialEnds));
          }
          setUser((prev) => ({
            ...prev,
            name: data.user.name || prev.name,
            email: data.user.email || prev.email,
            plan: serverPlan,
            subscriptionId: serverSubId || prev.subscriptionId
          }));
          if (serverPlan) {
            const wasConnected = localStorage.getItem("fa_erp_connected") === "true";
            const currentErp = (localStorage.getItem("fa_erp_type") || "").toLowerCase();
            if (wasConnected && currentErp) {
              try {
                const connRes = await apiFetch(`/api/connections?mail=${encodeURIComponent(data.user.email || email)}`);
                const conns = await connRes.json();
                if (Array.isArray(conns) && conns.length > 0) {
                  const matchingConn = conns.find(
                    (c) => c.status !== "Disconnected" && (c.platform || "").toLowerCase().includes(currentErp)
                  );
                  if (matchingConn) {
                    localStorage.setItem("fa_erp_connected", "true");
                    localStorage.setItem("fa_erp_type", currentErp);
                    if (matchingConn.companyId) {
                      localStorage.setItem("fa_current_company_id", matchingConn.companyId);
                    }
                  } else {
                    localStorage.removeItem("fa_erp_connected");
                    localStorage.removeItem("fa_erp_type");
                    localStorage.removeItem("fa_current_company_id");
                  }
                }
              } catch (_) {}
            }
            setView("dashboard");
          } else {
            setView("welcome");
            handleOpenTrialSelect();
          }
          return;
        }
      } catch (e) {
        console.warn("Session restore verify failed:", e);
        if (mounted) {
          logout();
          if (!hasNotifiedSessionExpiredRef.current) {
            hasNotifiedSessionExpiredRef.current = true;
            notify("Your session has expired. Please sign in again.", "error");
          }
        }
      }
    }
    const timer = setTimeout(initSession, 350);
    return () => { mounted = false; clearTimeout(timer); };
  }, [logout, notify]);

  // Trial expiration watcher: Polls every second when user is on a trial plan
  // Shows TrialExpiredModal, clears master data from Excel workbook, and syncs with backend
  useEffect(() => {
    // CRITICAL: NEVER run watcher on welcome or loading screens, or when not logged in
    if (view === "welcome" || view === "loading") {
      return;
    }
    const token = localStorage.getItem("fa_jwt_token");
    if (!token) {
      return;
    }
    if (isTokenExpired(token)) {
      setShowTrialExpired(false);
      logout();
      if (!hasNotifiedSessionExpiredRef.current) {
        hasNotifiedSessionExpiredRef.current = true;
        notify("Your session has expired. Please sign in again.", "error");
      }
      return;
    }

    const getTrialEndTimestamp = () => {
      const trialEndsStr = localStorage.getItem("fa_trial_ends_at");
      if (trialEndsStr) {
        const num = Number(trialEndsStr);
        if (!isNaN(num) && num > 0) return num;
        const dateNum = new Date(trialEndsStr).getTime();
        if (!isNaN(dateNum) && dateNum > 0) return dateNum;
      }
      const trialStartStr = localStorage.getItem("fa_trial_start");
      if (trialStartStr) {
        const num = Number(trialStartStr);
        if (!isNaN(num) && num > 0) {
          return num + 2 * 60 * 1000;
        }
      }
      return null;
    };

    let checkedBackend = false;

    const checkExpiration = async () => {
      // 1. If session has expired, log user out directly and DO NOT show any dialog
      const currentToken = localStorage.getItem("fa_jwt_token");
      if (!currentToken || isTokenExpired(currentToken)) {
        setShowTrialExpired(false);
        logout();
        if (!hasNotifiedSessionExpiredRef.current) {
          hasNotifiedSessionExpiredRef.current = true;
          notify("Your session has expired. Please sign in again.", "error");
        }
        return;
      }

      const currentPlanNow = (user?.plan || localStorage.getItem("fa_plan") || localStorage.getItem("fa_subscription_plan") || "").toLowerCase();
      const isPaid = currentPlanNow.includes("basic") || currentPlanNow.includes("standard") || currentPlanNow.includes("pro") || currentPlanNow.includes("enterprise");

      // Paid users never see the trial expired modal
      if (isPaid) {
        setShowTrialExpired(false);
        return;
      }

      const endTs = getTrialEndTimestamp();
      const isLocallyExpired = currentPlanNow === "expired" || (endTs && Date.now() >= endTs);

      if (isLocallyExpired) {
        const isOnUpgradeScreens = view === "plans" || view === "payment" || view === "success";
        if (!isOnUpgradeScreens) {
          setShowTrialExpired(true);
        }

        // Clear master data from Excel workbook upon trial expiration
        ExcelService.clearMasterData().catch((err) =>
          console.warn("Failed to clear master data on trial expiry:", err)
        );

        // Verify status with backend if not already verified
        if (!checkedBackend && localStorage.getItem("fa_jwt_token")) {
          checkedBackend = true;
          try {
            const res = await apiFetch("/api/auth/me");
            const data = await res.json();
            if (data?.user) {
              const uPlan = (data.user.plan || "").toLowerCase();
              const serverIsPaid = uPlan.includes("basic") || uPlan.includes("standard") || uPlan.includes("pro") || uPlan.includes("enterprise");

              if (serverIsPaid) {
                // User upgraded on another device/window
                setShowTrialExpired(false);
                setUser((prev) => ({ ...prev, plan: data.user.plan }));
                localStorage.setItem("fa_plan", data.user.plan);
                localStorage.setItem("fa_subscription_plan", data.user.plan);
              } else {
                localStorage.setItem("fa_plan", "expired");
                localStorage.setItem("fa_subscription_plan", "expired");
                if (!isOnUpgradeScreens) {
                  setShowTrialExpired(true);
                }
              }
            }
          } catch (e) {
            if (e.message && e.message.includes("Session expired")) {
              setShowTrialExpired(false);
              logout();
              if (!hasNotifiedSessionExpiredRef.current) {
                hasNotifiedSessionExpiredRef.current = true;
                notify("Your session has expired. Please sign in again.", "error");
              }
              return;
            }
            console.warn("Could not verify trial expiration with server:", e);
          }
        }
      } else if (!endTs) {
        if (!checkedBackend && localStorage.getItem("fa_jwt_token")) {
          checkedBackend = true;
          try {
            const res = await apiFetch("/api/auth/me");
            const data = await res.json();
            if (data?.user?.trialEndsAt) {
              const ts = new Date(data.user.trialEndsAt).getTime();
              localStorage.setItem("fa_trial_ends_at", String(ts));
            }
          } catch (_) {}
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [user?.plan, view, logout, notify]);

  const handlePaymentSuccess = async (data = {}) => {
    let selectedPlan = data?.plan || orderRef.current?.name || order?.name || "Pro";
    // Normalize casing for backend Joi validation (requires 'Basic', 'Standard', 'Pro')
    if (/^basic$/i.test(selectedPlan)) selectedPlan = "Basic";
    else if (/^standard$/i.test(selectedPlan)) selectedPlan = "Standard";
    else if (/^pro$/i.test(selectedPlan)) selectedPlan = "Pro";

    const email = user.email || localStorage.getItem("fa_user_email");
    if (email) {
      try {
        await apiFetch("/api/payments/complete", {
          method: "POST",
          body: JSON.stringify({ email, plan: selectedPlan })
        });
      } catch (err) {
        console.warn("Could not sync payment complete to backend:", err);
      }
    }

    // Refresh official profile from backend
    let subId = data?.subscriptionId || orderRef.current?.subscriptionId || "";
    let finalPlan = selectedPlan;
    try {
      const meRes = await apiFetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData?.user) {
        finalPlan = meData.user.plan || finalPlan;
        subId = meData.user.subscriptionId || subId;
      }
    } catch (_) {}

    if (!subId) {
      subId = localStorage.getItem("fa_subscription_id") || ("FA-SUB-" + Math.floor(100000 + Math.random() * 900000));
    }

    localStorage.setItem("fa_plan", finalPlan);
    localStorage.setItem("fa_subscription_plan", finalPlan);
    localStorage.setItem("fa_subscription_id", subId);

    setUser((prev) => ({
      ...prev,
      plan: finalPlan,
      subscriptionId: subId
    }));

    notify("Payment successful.", "success", `Subscribed to the ${finalPlan} plan.`);
    setView("success");
  };

  const startTrial = useCallback(async () => {
    setBusy(true);
    try {
      const response = await apiFetch("/api/auth/start-trial", { method: "POST" });
      const result = await response.json();
      const serverUser = result?.user || {};
      const finalPlan = serverUser.plan || "trial";
      const subId = serverUser.subscriptionId || serverUser.id || localStorage.getItem("fa_subscription_id") || ("FA-SUB-" + Math.floor(100000 + Math.random() * 900000));
      const endTimestamp = serverUser.trialEndsAt
        ? new Date(serverUser.trialEndsAt).getTime()
        : Date.now() + 2 * 60 * 1000;

      localStorage.setItem("fa_has_subscription", "true");
      localStorage.setItem("fa_plan", finalPlan);
      localStorage.setItem("fa_subscription_plan", finalPlan);
      localStorage.setItem("fa_subscription_id", String(subId));
      localStorage.setItem("fa_trial_ends_at", String(endTimestamp));

      setUser((prev) => ({
        ...prev,
        name: serverUser.name || prev.name || localStorage.getItem("fa_user_name") || "",
        email: serverUser.email || prev.email || localStorage.getItem("fa_user_email") || "",
        plan: finalPlan,
        subscriptionId: String(subId)
      }));

      setShowTrialPopup(false);
      notify("Free Trial started successfully!", "success");
      setView("dashboard");
    } catch (error) {
      console.error("Start trial error:", error);
      notify(error.message || "Couldn't start your free trial. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    const receive = (event) => {
      if (!isTrustedOrigin(event.origin)) return;
      let data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (_) {}
      }
      if (["payment_success", "checkout_complete"].includes(data?.type)) {
        handlePaymentSuccess(data);
      }
      if (["qb_connected", "xero_connected"].includes(data)) {
        setView("dashboard");
      }
      if (data?.type === "START_TRIAL") {
        setShowTrialPopup(false);
        startTrial();
      }
      if (data?.type === "VIEW_PLANS") {
        setShowTrialPopup(false);
        setView("plans");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [startTrial]);

  const handleOpenTrialSelect = useCallback(() => {
    setShowTrialPopup(true);
  }, []);

  const saveUser = async (profile) => {
    hasNotifiedSessionExpiredRef.current = false;
    const next = {
      name: profile.name || profile.user?.name || "",
      email: profile.email || profile.user?.email || "",
      plan: profile.plan || profile.user?.plan || localStorage.getItem("fa_plan") || localStorage.getItem("fa_subscription_plan") || "",
      subscriptionId: profile.subscriptionId || profile.user?.subscriptionId || localStorage.getItem("fa_subscription_id") || ""
    };
    Object.entries({
      fa_user_name: next.name,
      fa_user_email: next.email,
      fa_plan: next.plan,
      fa_subscription_plan: next.plan,
      fa_subscription_id: next.subscriptionId,
      fa_jwt_token: profile.token || "",
      fa_refresh_token: profile.refreshToken || ""
    }).forEach(([key, value]) => value && localStorage.setItem(key, value));

    if (next.email) saveAccount({ name: next.name, email: next.email, provider: profile.provider || "google" });

    // Query backend to confirm whether user already has an active subscription
    try {
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();
      if (data?.user?.plan) {
        next.plan = data.user.plan;
        next.subscriptionId = data.user.subscriptionId || next.subscriptionId;
        localStorage.setItem("fa_plan", next.plan);
        localStorage.setItem("fa_subscription_plan", next.plan);
        if (next.subscriptionId) localStorage.setItem("fa_subscription_id", next.subscriptionId);
        if (data.user.trialEndsAt) {
          const trialEnds = new Date(data.user.trialEndsAt).getTime();
          localStorage.setItem("fa_trial_ends_at", String(trialEnds));
        }
      }
    } catch (_) {}

    setUser(next);
    if (next.plan) {
      localStorage.removeItem("fa_erp_connected");
      localStorage.removeItem("fa_erp_type");
      localStorage.removeItem("fa_current_company_id");
      sessionStorage.setItem("fa_erp_user_disconnected", "true");
      setView("dashboard");
    } else {
      // Pop up the Choose Your Plan dialog, keep background on welcome or loading
      handleOpenTrialSelect();
    }
  };

  const authenticate = (provider, loginHint) => {
    setBusy(provider);
    try {
      openAuth(
        provider,
        (profile) => {
          saveUser(profile);
          setBusy(null);
        },
        loginHint,
        () => setBusy(null)   // user closed the popup without signing in
      );
    } catch (error) {
      notify(error.message, "error");
      setBusy(null);
    }
  };


  const content = useMemo(() => {
    if (view === "loading") return <Loading />;
    if (view === "welcome") return <Welcome busy={busy} onAuth={authenticate}/>;
    if (view === "trial") return <TrialSelect busy={busy} onTrial={startTrial} onPlans={() => setView("plans")}/>;
    if (view === "plans") return (
      <Plans
        user={user}
        onBack={() => setView(user?.plan ? "dashboard" : "welcome")}
        onSelect={(plan, price, cycle) => {
          const token = localStorage.getItem("fa_jwt_token");
          if (!token || isTokenExpired(token)) {
            logout();
            notify("Your session has expired. Please sign in again.", "error");
            return;
          }
          setOrder({ ...plan, price, cycle });
          setView("payment");
        }}
      />
    );
    if (view === "payment") return <Payment user={user} order={order} notify={notify} onBack={() => setView("plans")} onDone={handlePaymentSuccess}/>;
    if (view === "success") return <Success user={user} order={order} onContinue={() => setView("dashboard")} />;
    return (
      <Dashboard
        user={user}
        notify={notify}
        unreadCount={unreadCount}
        onToggleNotifications={toggleDrawer}
        onClearNotifications={clearAllNotifications}
        onLogout={logout}
        onChangePlan={() => setView("plans")}
        onConnect={(provider, reconnectId) => {
          const popup = openErp(provider, user, reconnectId);
          if (!popup) notify("The connection window was blocked. Please allow popups and try again.", "error");
        }}
        onTrialExpired={() => setShowTrialExpired(true)}
      />
    );
  }, [view, user, busy, order, unreadCount, toggleDrawer, clearAllNotifications, logout, notify]);

  return (
    <div className={`app ${hasGlobalBanner ? "has-global-banner" : ""}`}>
      <GlobalErrorBanner onBannerChange={setHasGlobalBanner} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {drawerOpen && (
        <NotificationDrawer
          notifications={visibleNotifications}
          topOffset={drawerTop}
          onClose={() => setDrawerOpen(false)}
          onClearAll={clearAllNotifications}
        />
      )}
      {showTrialPopup && (
        <TrialSelectModal
          onTrial={startTrial}
          onPlans={() => {
            setShowTrialPopup(false);
            setView("plans");
          }}
          onClose={() => setShowTrialPopup(false)}
          busy={busy}
        />
      )}
      {showTrialExpired && (
        <TrialExpiredModal
          onUpgrade={() => {
            const token = localStorage.getItem("fa_jwt_token");
            if (!token || isTokenExpired(token)) {
              setShowTrialExpired(false);
              logout();
              notify("Your session has expired. Please sign in again.", "error");
              return;
            }
            setShowTrialExpired(false);
            setView("plans");
          }}
          onClose={() => setShowTrialExpired(false)}
          onLogout={logout}
        />
      )}
      {content}
    </div>
  );
}

