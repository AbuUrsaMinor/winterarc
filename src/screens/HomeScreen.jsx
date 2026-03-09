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

export default function HomeScreen({ day, alreadyDone, onComplete, onViewStats }) {
  const { pushups, situps, plankSecs } = getTargets(day)

  return (
    <div className="screen">
      <div className="app-header">
        <img
          src={`${import.meta.env.BASE_URL}icon.svg`}
          className="app-icon"
          alt="Winter Arc"
        />
        <span className="app-title">Winter Arc</span>
      </div>

      <div className="day-badge">Day {day}</div>

      <div className="exercise-grid">
        <ExerciseCard emoji="💪" value={pushups} unit="reps" label="Push-ups" />
        <ExerciseCard emoji="🔥" value={situps} unit="reps" label="Sit-ups" />
        <ExerciseCard emoji="⏱" value={formatPlank(plankSecs)} label="Plank" />
      </div>

      {alreadyDone ? (
        <>
          <div className="done-message">
            <span>✓</span>
            <span>Already crushed it today</span>
          </div>
          <button className="btn-secondary" onClick={onViewStats}>
            View Stats
          </button>
        </>
      ) : (
        <button className="btn-primary" onClick={onComplete}>
          Done for Today
        </button>
      )}
    </div>
  )
}
