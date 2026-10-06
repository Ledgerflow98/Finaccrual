import React from "react";

export function SubscriptionCard({
  planClean,
  connectedCount,
  maxCompanies,
  remainingCompanies,
  onChangePlan,
  onManageCompanies,
  notify,
}) {
  return (
    <div className="fa-sub-card">
      <div className="fa-sub-title">CURRENT PLAN</div>
      <div className="fa-sub-stats">
        <div className="fa-sub-stat">
          <div className="fa-sub-stat-label">CURRENT PLAN</div>
          <div className="fa-sub-stat-value">{planClean}</div>
        </div>
        <div className="fa-sub-stat-divider"></div>
        <div className="fa-sub-stat">
          <div className="fa-sub-stat-label">CONNECTED COMPANIES</div>
          <div className="fa-sub-stat-value">
            {connectedCount} / {maxCompanies}
          </div>
        </div>
        <div className="fa-sub-stat-divider"></div>
        <div className="fa-sub-stat">
          <div className="fa-sub-stat-label">REMAINING</div>
          <div className="fa-sub-stat-value">{remainingCompanies}</div>
        </div>
      </div>
      <div className="fa-sub-actions">
        <button
          className="fa-btn-sub-outline"
          onClick={onChangePlan}
        >
          Change Plan
        </button>
        <button
          className="fa-btn-sub-outline"
          onClick={onManageCompanies}
        >
          Manage Companies
        </button>
      </div>
    </div>
  );
}
