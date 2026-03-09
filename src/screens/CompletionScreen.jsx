import { formatLifetimePlank } from '../workout.js'

function StatItem({ label, value }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function CompletionScreen({ stats, freezeUsed, onBack }) {
  const {
    currentStreak,
    bestStreak,
    totalWorkouts,
    totalPushups,
    totalSitups,
    totalPlankSecs,
    bestDay,
  } = stats

  return (
    <div className="screen">
      <div className="completion-header">
        <div className="completion-emoji">🏔️</div>
        <div className="completion-title">Arc Maintained</div>
        {freezeUsed && (
          <div className="freeze-banner">
            ❄️ Streak saved — don&apos;t let it happen again.
          </div>
        )}
      </div>

      <div className="streak-display">
        <span className="streak-number">{currentStreak}</span>
        <span className="streak-label">day streak 🔥</span>
      </div>

      <div className="stats-grid">
        <StatItem label="Best Streak" value={`${bestStreak}d`} />
        <StatItem label="Workouts" value={totalWorkouts} />
        <StatItem label="Best Day" value={`Day ${bestDay}`} />
        <StatItem label="Push-ups" value={totalPushups.toLocaleString()} />
        <StatItem label="Sit-ups" value={totalSitups.toLocaleString()} />
        <StatItem label="Plank" value={formatLifetimePlank(totalPlankSecs)} />
      </div>

      <button className="btn-secondary" onClick={onBack}>
        Back
      </button>
    </div>
  )
}
