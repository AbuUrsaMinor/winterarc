import { getTargets, formatPlank } from '../workout.js'

function ExerciseCard({ emoji, value, unit, label }) {
  return (
    <div className="exercise-card">
      <span className="exercise-emoji">{emoji}</span>
      <span className="exercise-value">{value}</span>
      {unit && <span className="exercise-unit">{unit}</span>}
      <span className="exercise-label">{label}</span>
    </div>
  )
}

export default function FreezeScreen({ yesterdayDay, todayDay, onMakeItRight, onGiveUp }) {
  const y = getTargets(yesterdayDay)
  const t = getTargets(todayDay)
  const combined = {
    pushups: y.pushups + t.pushups,
    situps: y.situps + t.situps,
    plankSecs: y.plankSecs + t.plankSecs,
  }

  return (
    <div className="screen freeze-screen">
      <div className="warning-icon">⚠️</div>

      <div style={{ textAlign: 'center' }}>
        <div className="freeze-title">You Missed Yesterday</div>
        <p className="freeze-subtitle" style={{ marginTop: 6 }}>
          One chance to save your streak. Do both days now.
        </p>
      </div>

      <div className="freeze-breakdown">
        <div className="freeze-day-row">
          <span className="freeze-day-label">Yesterday — Day {yesterdayDay}</span>
          <span className="freeze-day-targets">
            {y.pushups} push-ups · {y.situps} sit-ups · {formatPlank(y.plankSecs)} plank
          </span>
        </div>
        <div className="freeze-divider">+</div>
        <div className="freeze-day-row">
          <span className="freeze-day-label">Today — Day {todayDay}</span>
          <span className="freeze-day-targets">
            {t.pushups} push-ups · {t.situps} sit-ups · {formatPlank(t.plankSecs)} plank
          </span>
        </div>
      </div>

      <div className="exercise-grid">
        <ExerciseCard emoji="💪" value={combined.pushups} unit="reps" label="Push-ups" />
        <ExerciseCard emoji="🔥" value={combined.situps} unit="reps" label="Sit-ups" />
        <ExerciseCard emoji="⏱" value={formatPlank(combined.plankSecs)} label="Plank" />
      </div>

      <button className="btn-primary btn-amber" onClick={onMakeItRight}>
        Make It Right
      </button>
      <button className="btn-ghost" onClick={onGiveUp}>
        I Give Up — Reset
      </button>
    </div>
  )
}
