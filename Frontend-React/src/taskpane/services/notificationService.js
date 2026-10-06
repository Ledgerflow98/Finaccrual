/**
 * Notification Service for FinAccrual React
 * Syncs with backend /api/notifications and manages notifications list & badges.
 */
import { apiFetch } from "../api";

export const NotificationService = {
  MAX_ITEMS: 50,

  _normalizeProvider(provider) {
    if (!provider) return null;
    const lower = String(provider).trim().toLowerCase();
    if (lower === "quickbooks" || lower === "xero") return lower;
    return null;
  },

  _mapFromBackend(row) {
    return {
      id: row.id,
      type: row.type === "error" ? "error" : "success",
      message: row.message || "",
      detail: row.detail || "",
      provider: this._normalizeProvider(row.provider),
      timestamp: row.createdAt || row.created_at || new Date().toISOString(),
      read: !!row.read
    };
  },

  TTL_MS: 24 * 60 * 60 * 1000, // 24 hours

  isNotExpired(timestamp) {
    if (!timestamp) return false;
    const time = new Date(timestamp).getTime();
    if (isNaN(time)) return false;
    return Date.now() - time < this.TTL_MS;
  },

  filterValid(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.filter((n) => this.isNotExpired(n?.timestamp));
  },

  async fetchNotifications() {
    try {
      const res = await apiFetch("/api/notifications");
      if (!res.ok) return [];
      const data = await res.json();
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      return this.filterValid(rows.map((r) => this._mapFromBackend(r)));
    } catch (_) {
      return [];
    }
  },

  async postNotification(type, message, detail, provider) {
    try {
      const normalizedProvider = this._normalizeProvider(provider);
      const res = await apiFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          type: type === "error" ? "error" : "success",
          message: String(message || "").trim(),
          detail: detail ? String(detail).trim() : undefined,
          provider: normalizedProvider || undefined
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.notification ? this._mapFromBackend(data.notification) : null;
    } catch (_) {
      return null;
    }
  },

  async markRead(ids) {
    if (!ids || ids.length === 0) return;
    try {
      await apiFetch("/api/notifications/mark-read", {
        method: "PATCH",
        body: JSON.stringify({ ids })
      });
    } catch (_) {}
  },

  async clearAll(provider) {
    try {
      const normalized = this._normalizeProvider(provider);
      const url = normalized
        ? `/api/notifications?provider=${encodeURIComponent(normalized)}`
        : "/api/notifications";
      const res = await apiFetch(url, { method: "DELETE" });
      return res.ok;
    } catch (_) {
      return false;
    }
  }
};
