import { formatPlank } from "../workout.js";

function formatDisplayDate(selectedDate, today) {
  if (selectedDate === today) {
    return { label: "Today", detail: selectedDate };
  }

  const date = new Date(`${selectedDate}T12:00:00`);
  return {
    label: new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date),
    detail: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
  };
}

function formatActivityValue(activity, timerRemaining, timerIsActive) {
  if (activity.isTimer) {
    if (timerIsActive) return formatPlank(timerRemaining);
    return formatPlank(activity.targetValue);
  }
  return activity.targetValue;
}

function ExerciseCard({
  selectedDate,
  activity,
  completion,
  timerState,
  timerRemaining,
  onToggleCompletion,
  onStartTimer,
}) {
  const timerIsActive =
    timerState &&
    timerState.activity.id === activity.id &&
    timerState.date === selectedDate;
  const done = Boolean(completion?.completed);
  const value = formatActivityValue(activity, timerRemaining, timerIsActive);
  const status = done ? "done" : timerIsActive ? "running" : "pending";

  const handleClick = () => {
    if (activity.isTimer) {
      if (!done && !timerIsActive) onStartTimer(activity);
      return;
    }
    onToggleCompletion(activity, !done);
  };

  return (
    <button className={`exercise-card activity-button ${status}`} onClick={handleClick}>
      <div className="activity-card-top">
        <span className="exercise-emoji">{activity.emoji || "•"}</span>
        <span className={`activity-chip ${status}`}>
          {done ? "Done" : timerIsActive ? "Running" : activity.isTimer ? "Timer" : "Ready"}
        </span>
      </div>
      <div className="exercise-main">
        <span className="exercise-value">{value}</span>
        {activity.unitLabel && <span className="exercise-unit">{activity.unitLabel}</span>}
      </div>
      <span className="exercise-label">{activity.name}</span>
      <span className="activity-status">
        {done
          ? "Completed for this date"
          : timerIsActive
            ? "Timer in progress"
            : activity.isTimer
              ? "Tap to start countdown"
              : "Tap to mark complete"}
      </span>
    </button>
  );
}

export default function HomeScreen({
  selectedDate,
  today,
  dueActivities,
  completionMap,
  timerState,
  timerRemaining,
  currentStreak,
  freezeInventory,
  onPrevDate,
  onNextDate,
  onToggleCompletion,
  onStartTimer,
  onOpenSettings,
  onViewStats,
}) {
  const isToday = selectedDate >= today;
  const missingCount = dueActivities.filter((a) => !completionMap[a.id]?.completed).length;
  const completedCount = dueActivities.length - missingCount;
  const dateDisplay = formatDisplayDate(selectedDate, today);
  const gridClass = dueActivities.length <= 3 ? "activity-list-stack" : "activity-list-grid";

  return (
    <div className="screen home-screen">
      <div className="app-header">
        <img
          src={`${import.meta.env.BASE_URL}icon.svg`}
          className="app-icon"
          alt="Winter Arc"
        />
        <span className="app-title">Winter Arc</span>
      </div>

      <div className="home-hero">
        <div className="hero-copy">
          <span className="hero-kicker">{dateDisplay.label}</span>
          <div className="hero-date">{dateDisplay.detail}</div>
          <div className="hero-status">
            {missingCount === 0
              ? "All due activities complete"
              : `${missingCount} activit${missingCount === 1 ? "y" : "ies"} left to finish`}
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Streak</span>
            <span className="hero-stat-value">{currentStreak}</span>
          </div>
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Freeze</span>
            <span className="hero-stat-value">{freezeInventory}/1</span>
          </div>
          <div className="hero-stat-pill">
            <span className="hero-stat-label">Done</span>
            <span className="hero-stat-value">{completedCount}/{dueActivities.length}</span>
          </div>
        </div>
      </div>

      <div className="day-nav home-nav">
        <button className="btn-ghost day-nav-btn nav-orb" onClick={onPrevDate}>
          ←
        </button>
        <div className="day-nav-center">
          <div className="mini-meta nav-caption">Move through completed dates</div>
        </div>
        <button className="btn-ghost day-nav-btn nav-orb" onClick={onNextDate} disabled={isToday}>
          →
        </button>
      </div>

      <div className={`exercise-grid ${gridClass}`}>
        {dueActivities.length === 0 && (
          <div className="freeze-breakdown empty-state-card">
            No activities are due on this date.
          </div>
        )}

        {dueActivities.map((activity) => (
          <ExerciseCard
            key={activity.id}
            selectedDate={selectedDate}
            activity={activity}
            completion={completionMap[activity.id]}
            timerState={timerState}
            timerRemaining={timerRemaining}
            onToggleCompletion={onToggleCompletion}
            onStartTimer={onStartTimer}
          />
        ))}
      </div>

      <div className="done-message completion-strip">
        <span>
          {missingCount === 0
            ? "Arc locked in for this date"
            : `${missingCount} due activit${missingCount === 1 ? "y" : "ies"} remaining`}
        </span>
      </div>

      <div className="home-actions">
        <button className="btn-secondary btn-utility" onClick={onViewStats}>
          Progress
        </button>
        <button className="btn-secondary btn-utility" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </div>
  );
}
