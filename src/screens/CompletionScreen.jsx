function StatItem({ label, value }) {
  return (
    <div className="stat-item stat-item-rich">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function formatDisplayDate(selectedDate) {
  const date = new Date(`${selectedDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function CompletionScreen({
  stats,
  freezeUsed,
  selectedDate,
  onBack,
}) {
  const {
    currentStreak,
    bestStreak,
    freezeInventory,
    totalCompletedDates,
    totalsByActivity,
  } = stats;
  const formattedDate = formatDisplayDate(selectedDate);

  return (
    <div className="screen completion-screen-shell">
      <div className="completion-hero">
        <div className="completion-header">
          <div className="completion-emoji">🏔️</div>
          <div className="completion-title">Arc Maintained</div>
          <div className="mini-meta">Completed {formattedDate}</div>
        </div>
        {freezeUsed && (
          <div className="freeze-banner">
            ❄️ Streak saved — don&apos;t let it happen again.
          </div>
        )}

        <div className="streak-display streak-display-panel">
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-label">day streak alive</span>
        </div>

        <div className="hero-stats completion-summary-grid">
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Best</span>
            <span className="hero-stat-value">{bestStreak}d</span>
          </div>
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Freeze</span>
            <span className="hero-stat-value">{freezeInventory}/1</span>
          </div>
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Dates</span>
            <span className="hero-stat-value">{totalCompletedDates}</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="section-heading">Lifetime Totals</div>
        <div className="stats-grid stats-grid-rich">
          {totalsByActivity.map((item) => (
            <StatItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>

      <button className="btn-secondary btn-utility" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
