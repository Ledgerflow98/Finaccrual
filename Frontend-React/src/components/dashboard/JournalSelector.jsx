import React from "react";

export function JournalSelector({ journal, onChangeJournal }) {
  return (
    <>
      <div className="fa-section-label">JOURNAL TYPE</div>
      <div className="fa-journal-btns">
        <button
          className={`fa-journal-btn ${journal === "accrual" ? "active" : ""}`}
          onClick={() => onChangeJournal("accrual")}
        >
          Accrual
        </button>
        <button
          className={`fa-journal-btn ${journal === "prepaid" ? "active" : ""}`}
          onClick={() => onChangeJournal("prepaid")}
        >
          Prepaid
        </button>
        <button
          className={`fa-journal-btn ${journal === "deferred" ? "active" : ""}`}
          onClick={() => onChangeJournal("deferred")}
        >
          Deferred Rev
        </button>
      </div>
    </>
  );
}
