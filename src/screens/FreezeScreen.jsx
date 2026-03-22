export default function FreezeScreen({
  missedDate,
  freezeInventory,
  onUseFreeze,
  onBackfill,
  onGiveUp,
}) {
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${missedDate}T12:00:00`));

  return (
    <div className="screen freeze-screen freeze-screen-shell">
      <div className="freeze-hero">
        <div className="warning-icon">⚠️</div>
        <div className="completion-header">
          <div className="freeze-title">Missed Date Detected</div>
          <p className="freeze-subtitle">
            You missed due activities on {formattedDate}. Recover the streak by backfilling the date or spend your freeze.
          </p>
        </div>

        <div className="hero-stats freeze-summary-grid">
          <div className="hero-stat-pill freeze-pill">
            <span className="hero-stat-label">Date</span>
            <span className="hero-stat-value freeze-stat-value">{missedDate}</span>
          </div>
          <div className="hero-stat-pill freeze-pill">
            <span className="hero-stat-label">Freeze</span>
            <span className="hero-stat-value">{freezeInventory}/1</span>
          </div>
        </div>
      </div>

      <div className="freeze-breakdown freeze-breakdown-card">
        <div className="freeze-day-row">
          <span className="freeze-day-label">Freeze Inventory</span>
          <span className="freeze-day-targets">{freezeInventory}/1 available</span>
        </div>
        <div className="freeze-day-row">
          <span className="freeze-day-label">Recommendation</span>
          <span className="freeze-day-targets">
            Backfill first to keep real completion history.
          </span>
        </div>
      </div>

      <div className="freeze-actions">
        <button className="btn-secondary" onClick={onBackfill}>
          Backfill Missed Date
        </button>

        <button
          className="btn-primary btn-amber"
          onClick={onUseFreeze}
          disabled={freezeInventory <= 0}
        >
          Use Freeze
        </button>

        <button className="btn-ghost freeze-reset-btn" onClick={onGiveUp}>
          I Give Up — Reset
        </button>
      </div>
    </div>
  );
}
