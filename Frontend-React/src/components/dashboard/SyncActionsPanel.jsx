import React from "react";
import { RefreshIcon, PlayIcon, DownloadIcon } from "./DashboardIcons";

export function SyncActionsPanel({
  label,
  spinning,
  setupBusy,
  pullBusy,
  isSetupDone,
  isPullDone,
  logs,
  onRefresh,
  onSetup,
  onPull,
}) {
  return (
    <>
      {/* SCHEDULE SECTION */}
      <div className="schedule-header-row">
        <span className="fa-section-label">SCHEDULE</span>
        <button
          className="refresh-schedule-btn"
          onClick={onRefresh}
          disabled={spinning || pullBusy || setupBusy}
        >
          <RefreshIcon spinning={spinning} />
          {spinning ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <button
        className="conn-action-btn primary-btn"
        onClick={onSetup}
        disabled={setupBusy || pullBusy || spinning}
      >
        <PlayIcon />
        {setupBusy ? "Setting up sheets…" : "Setup Master & Input Sheets"}
      </button>

      <button
        className="conn-action-btn secondary-btn"
        onClick={onPull}
        disabled={pullBusy || setupBusy || spinning}
      >
        <DownloadIcon />
        {pullBusy ? "Pulling Master Data…" : `Pull Master Data from ${label}`}
      </button>

      {/* PROGRESS CONSOLE (Exact match to vanilla frontend) */}
      <div className="conn-progress-panel">
        <div className="conn-step complete">
          <span className="conn-step-num">1</span>
          <span className="conn-step-label">Connect to {label}</span>
        </div>
        <div className={`conn-step ${isSetupDone ? "complete" : setupBusy ? "active" : ""}`}>
          <span className="conn-step-num">2</span>
          <span className="conn-step-label">Setup Master &amp; Input Sheets</span>
        </div>
        <div className={`conn-step ${isPullDone ? "complete" : pullBusy ? "active" : ""}`}>
          <span className="conn-step-num">3</span>
          <span className="conn-step-label">Pull Master Data from {label}</span>
        </div>
        <div className="conn-log">
          {logs.map((line, idx) => {
            const isError = /error|fail|failed|unable|denied|invalid/i.test(line);
            return (
              <div key={idx} className={`log-line ${isError ? "log-error" : ""}`}>
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
