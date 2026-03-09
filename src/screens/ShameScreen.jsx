export default function ShameScreen({ message, deadStreak, onContinue }) {
  return (
    <div className="screen shame-screen">
      <div className="shame-icon">💀</div>

      {deadStreak > 0 && (
        <p className="dead-streak">
          You had a <strong>{deadStreak}-day streak</strong>. Had.
        </p>
      )}

      <blockquote className="bully-message">&ldquo;{message}&rdquo;</blockquote>

      <button className="btn-primary btn-shame" onClick={onContinue}>
        Fine. Day 1. Let&apos;s go.
      </button>
    </div>
  )
}
