export default function ShameScreen({ message, deadStreak, onContinue }) {
  return (
    <div className="screen shame-screen shame-screen-shell">
      <div className="shame-hero">
        <div className="shame-icon">💀</div>
        <div className="completion-header">
          <div className="completion-title shame-title">Streak Broken</div>
          {deadStreak > 0 && (
            <p className="dead-streak">
              You had a <strong>{deadStreak}-day streak</strong>. Had.
            </p>
          )}
        </div>
      </div>

      <blockquote className="bully-message shame-message-card">&ldquo;{message}&rdquo;</blockquote>

      <button className="btn-primary btn-shame" onClick={onContinue}>
        Reset to Day 1
      </button>
    </div>
  );
}
