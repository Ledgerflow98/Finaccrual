'use strict';

/**
 * Renders the HTML page presented to the user after Xero OAuth flow
 * to select which organizations to connect.
 *
 * @param {object} options
 * @param {Array} options.tenants
 * @param {Set<string>} options.activeTenantIds
 * @param {string} options.tier
 * @param {number} options.maxAllowed
 * @returns {string} HTML page string
 */
function renderCompanySelectionPage({ tenants, activeTenantIds, tier, maxAllowed }) {
    const tierLabel = tier === 'trial' ? 'Trial (1)' : tier === 'basic' ? 'Basic (1)' : tier === 'standard' ? 'Standard (3)' : 'Pro (10)';

    const companyRows = tenants.map(t => {
        const isSelected = activeTenantIds.has(t.tenantId);
        return `
        <div class="company-row ${isSelected ? 'selected already-connected' : ''}" id="row_${t.tenantId}" data-id="${t.tenantId}">
            <input
                type="checkbox"
                class="company-cb"
                id="cb_${t.tenantId}"
                value="${t.tenantId}"
                data-name="${(t.tenantName || 'Xero Organisation').replace(/"/g, '&quot;')}"
                ${isSelected ? 'checked disabled' : ''}
            />
            <div class="company-icon">xero</div>
            <div class="company-info">
                <div class="company-name">${t.tenantName || 'Xero Organisation'}${isSelected ? ' <span style="font-size:10px;color:#059669;font-weight:600;">(Already Connected)</span>' : ''}</div>
                <div class="company-id">Realm: ${t.tenantId}</div>
            </div>
        </div>
    `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Select Xero Companies</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #f4f6f9;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a2035;
  }
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 36px 32px 28px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  }
  .xero-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .xero-logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #13b5ea, #0d7db0);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; color: #fff; letter-spacing: -0.5px;
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1a2035;
    line-height: 1.3;
  }
  .subtitle {
    font-size: 13px;
    color: #64748b;
    margin-top: 6px;
    line-height: 1.5;
  }
  .plan-badge {
    display: inline-block;
    background: rgba(19, 181, 234, 0.15);
    color: #13b5ea;
    border: 1px solid rgba(19, 181, 234, 0.3);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 10px;
  }
  .company-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .company-list::-webkit-scrollbar { width: 4px; }
  .company-list::-webkit-scrollbar-track { background: transparent; }
  .company-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .company-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }
  .company-row:hover { border-color: #13b5ea; background: #f0f9ff; }
  /* Native checkbox — styled to be visible and large enough to tap */
  .company-cb {
    width: 18px;
    height: 18px;
    accent-color: #13b5ea;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0;
    pointer-events: none; /* Row click handler manages toggle; this prevents double-fire */
  }
  .company-row.selected {
    border-color: #13b5ea;
    background: rgba(19, 181, 234, 0.08);
  }
  .company-row.already-connected {
    opacity: 0.75;
    cursor: not-allowed;
    background: #f1f5f9;
  }
  .company-row.already-connected:hover {
    border-color: #e2e8f0;
    background: #f1f5f9;
  }
  .company-row.selected .company-icon { background: linear-gradient(135deg, #13b5ea, #0d7db0); }
  .company-icon {
    width: 36px; height: 36px;
    background: #e2e8f0;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    color: #64748b;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .company-row.selected .company-icon { color: #fff; }
  .company-info { flex: 1; min-width: 0; }
  .company-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a2035;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .company-id {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
    font-family: 'SFMono-Regular', Consolas, monospace;
  }
  /* cb-visual: shown at the right side as a custom dot indicator */
  .cb-visual {
    width: 22px; height: 22px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    cursor: pointer;
  }
  .company-row.selected .cb-visual {
    background: #13b5ea;
    border-color: #13b5ea;
  }
  .company-row.selected .cb-visual::after {
    content: '';
    width: 8px; height: 8px;
    background: #fff;
    border-radius: 50%;
    display: block;
  }
  .selection-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .selection-count {
    font-size: 12px;
    color: #64748b;
  }
  .selection-count span {
    color: #13b5ea;
    font-weight: 600;
  }
  .limit-warning {
    font-size: 11px;
    color: #d29922;
  }
  .btn-confirm {
    width: 100%;
    margin-top: 18px;
    padding: 13px;
    background: linear-gradient(135deg, #13b5ea, #0d7db0);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.3px;
  }
  .btn-confirm:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .btn-confirm.loading { pointer-events: none; }
  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-banner {
    display: none;
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.3);
    border-radius: 8px;
    padding: 10px 14px;
    margin-top: 12px;
    font-size: 13px;
    color: #f85149;
  }
</style>
</head>
<body>
<div class="card">
  <div class="xero-logo">
    <div class="xero-logo-icon">xero</div>
    <div>
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Connected to</div>
      <div style="font-size:15px;font-weight:700;color:#1a2035;">Xero</div>
    </div>
  </div>

  <h1>Select Your Companies</h1>
  <p class="subtitle">
    Choose the Xero organisations you want to use in FinAccrual.
    Your plan allows up to <strong style="color:#1a2035;">${maxAllowed}</strong> connected ${maxAllowed === 1 ? 'company' : 'companies'}.
  </p>
  <span class="plan-badge">${tierLabel.toUpperCase()} PLAN</span>

  <div class="company-list" id="companyList">
    ${companyRows}
  </div>

  <div class="selection-info">
    <span class="selection-count">Selected: <span id="selCount">0</span> / ${maxAllowed}</span>
    <span class="limit-warning" id="limitWarning" style="display:none;">Limit reached</span>
  </div>

  <div class="error-banner" id="errorBanner"></div>

  <button class="btn-confirm" id="btnConfirm" disabled>
    Connect Selected Companies
  </button>
</div>

<script>
  const MAX = ${maxAllowed};
  let selected = new Set();

  function updateUI() {
    const countEl = document.getElementById('selCount');
    const btn     = document.getElementById('btnConfirm');
    const warning = document.getElementById('limitWarning');
    countEl.textContent = selected.size;
    btn.disabled = selected.size === 0;
    warning.style.display = selected.size >= MAX ? 'inline' : 'none';
  }

  // Pre-populate selected set from initial checked checkboxes
  document.querySelectorAll('.company-cb:checked').forEach(cb => {
    selected.add(cb.value);
  });
  updateUI();

  // Use the checkbox change event (not click on the row) to avoid
  // the label double-fire issue where selection toggles on then immediately off.
  document.querySelectorAll('.company-cb').forEach(cb => {
    const id  = cb.value;
    const row = document.getElementById('row_' + id);

    // Clicking anywhere on the row should toggle the checkbox
    row.addEventListener('click', (e) => {
      if (cb.disabled) return;
      // If user clicked directly on the checkbox, the browser handles it — skip
      if (e.target === cb) return;
      // Otherwise manually toggle
      if (cb.checked) {
        cb.checked = false;
      } else {
        if (selected.size >= MAX && !selected.has(id)) return;
        cb.checked = true;
      }
      cb.dispatchEvent(new Event('change'));
    });

    cb.addEventListener('change', () => {
      if (cb.checked) {
        if (selected.size >= MAX) {
          cb.checked = false; // Enforce plan limit
          return;
        }
        selected.add(id);
        row.classList.add('selected');
      } else {
        selected.delete(id);
        row.classList.remove('selected');
      }
      updateUI();
    });
  });

  document.getElementById('btnConfirm').addEventListener('click', async () => {
    const btn = document.getElementById('btnConfirm');
    const errBanner = document.getElementById('errorBanner');
    if (selected.size === 0) return;

    // Only send newly selected companies (exclude already-connected disabled ones)
    const newlySelected = Array.from(selected).filter(id => {
      const cb = document.getElementById('cb_' + id);
      return cb && !cb.disabled;
    });

    if (newlySelected.length === 0) {
      errBanner.textContent = 'Please select at least one new company to connect.';
      errBanner.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span> Connecting...';
    errBanner.style.display = 'none';

    try {
      const res = await fetch('/api/xero/select-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTenantIds: newlySelected })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Standardized backend error envelope uses "message"; keep the
        // "error" fallback for backwards compatibility with old responses.
        throw new Error(err.message || err.error || 'Failed to save companies.');
      }

      // Notify parent window and close (mirrors existing SUCCESS_HTML pattern)
      if (window.opener) {
        window.opener.postMessage('xero_connected', '*');
      }
      // For Office dialog context
      if (typeof Office !== 'undefined' && Office.context && Office.context.ui) {
        Office.context.ui.messageParent('xero_connected');
      }
      window.close();
    } catch (err) {
      errBanner.textContent = err.message;
      errBanner.style.display = 'block';
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.innerHTML = 'Connect Selected Companies';
    }
  });
</script>
</body>
</html>`;
}

module.exports = { renderCompanySelectionPage };
