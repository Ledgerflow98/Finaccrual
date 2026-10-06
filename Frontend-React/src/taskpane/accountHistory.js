/**
 * Manages the fa_accounts_history array in localStorage.
 * Compatible with the vanilla frontend's format:
 *   [{ name: string, email: string, provider: "google" | "microsoft" }]
 * Stores up to 5 unique accounts (deduped by email, most-recent first).
 */

const STORAGE_KEY = "fa_accounts_history";
const MAX_ACCOUNTS = 5;

/**
 * Returns the stored accounts array (newest first).
 * @returns {{ name: string, email: string, provider: string }[]}
 */
export function getAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    const accounts = Array.isArray(parsed) ? parsed.filter((a) => a && a.email) : [];
    if (accounts.length > 0) return accounts;
  } catch {
    // fall through to fallback
  }

  // Fallback: build an entry from individual localStorage keys
  // (matches the vanilla frontend's viewBindings.js behaviour)
  const fallback = [];
  const email = localStorage.getItem("fa_user_email") || localStorage.getItem("fa_last_user_email");
  const name = localStorage.getItem("fa_user_name") || localStorage.getItem("fa_last_user_name") || email;
  const provider = localStorage.getItem("fa_user_provider") || localStorage.getItem("fa_last_user_provider") || "google";
  if (email) {
    fallback.push({ name, email, provider });
  }
  return fallback;
}

/**
 * Saves an account to history. Deduplicates by email (case-insensitive),
 * prepends to the front, and caps at MAX_ACCOUNTS.
 * @param {{ name: string, email: string, provider: string }} account
 */
export function saveAccount(account) {
  if (!account || !account.email) return;
  let accounts = getAccounts();
  // Remove any existing entry for this email
  accounts = accounts.filter(
    (a) => a.email.toLowerCase() !== account.email.toLowerCase()
  );
  // Prepend the new/updated entry
  accounts.unshift({
    name: account.name || account.email,
    email: account.email,
    provider: account.provider || "google",
  });
  // Cap at max
  if (accounts.length > MAX_ACCOUNTS) {
    accounts = accounts.slice(0, MAX_ACCOUNTS);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}
