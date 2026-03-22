import { useMemo, useState } from "react";

const emptyForm = {
  name: "",
  emoji: "",
  startValue: "",
  increase: "",
  period: "",
  periodUnit: "",
  unitLabel: "",
};

function formatDisplayDate(selectedDate) {
  const date = new Date(`${selectedDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ActivitySettingsScreen({
  activities,
  selectedDate,
  onSave,
  onArchive,
  onBack,
}) {
  const [form, setForm] = useState(emptyForm);
  const formattedDate = formatDisplayDate(selectedDate);

  const activeActivities = useMemo(
    () => activities.filter((a) => !a.archivedAt || a.archivedAt >= selectedDate),
    [activities, selectedDate]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (
      !form.name.trim() ||
      form.startValue === "" ||
      form.increase === "" ||
      form.period === "" ||
      !form.periodUnit ||
      !form.unitLabel
    ) {
      return;
    }

    const id = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Date.now();

    await onSave({
      ...form,
      id,
      startValue: Number(form.startValue),
      increase: Number(form.increase),
      period: Number(form.period),
      unitLabel: form.unitLabel === "none" ? "" : form.unitLabel,
      effectiveStartDate: selectedDate,
      archivedAt: null,
    });

    setForm(emptyForm);
  }

  return (
    <div className="screen settings-screen-shell">
      <div className="home-hero settings-hero">
        <div className="completion-header settings-header">
          <div className="completion-emoji">⚙️</div>
          <div className="completion-title">Activities</div>
          <div className="mini-meta">Changes take effect from {formattedDate}</div>
        </div>
        <div className="hero-status">
          Add new training blocks or archive ones you no longer want due.
        </div>
      </div>

      <div className="settings-section-card">
        <div className="section-heading">Active Schedule</div>
        <div className="settings-list">
          {activeActivities.map((activity) => (
            <div className="settings-row settings-card" key={activity.id}>
              <div className="settings-card-main">
                <div className="settings-card-title-row">
                  <span className="settings-emoji">{activity.emoji || "•"}</span>
                  <strong>{activity.name}</strong>
                </div>
                <div className="freeze-day-targets">
                  Starts at {activity.startValue}
                  {activity.unitLabel ? ` ${activity.unitLabel}` : ""} and changes by {activity.increase} every {activity.period} {activity.periodUnit}
                </div>
              </div>
              <button className="btn-ghost settings-archive-btn" onClick={() => onArchive(activity.id)}>
                Archive
              </button>
            </div>
          ))}
        </div>
      </div>

      <form className="settings-form settings-section-card" onSubmit={handleSubmit}>
        <div className="section-heading">Add Activity</div>
        <div className="settings-grid settings-grid-top">
          <input
            value={form.name}
            placeholder="Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            value={form.emoji}
            placeholder="Emoji (optional)"
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
          />
        </div>
        <div className="settings-grid">
          <input
            type="number"
            min="0"
            value={form.startValue}
            onChange={(e) => setForm({ ...form, startValue: e.target.value })}
            placeholder="Start"
            required
          />
          <input
            type="number"
            min="0"
            value={form.increase}
            onChange={(e) => setForm({ ...form, increase: e.target.value })}
            placeholder="Increase"
            required
          />
          <input
            type="number"
            min="1"
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            placeholder="Period"
            required
          />
          <select
            value={form.periodUnit}
            onChange={(e) => setForm({ ...form, periodUnit: e.target.value })}
            required
          >
            <option value="" disabled>
              Period unit
            </option>
            <option value="day">day</option>
            <option value="week">week</option>
          </select>
        </div>
        <select
          value={form.unitLabel}
          onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
          required
        >
          <option value="" disabled>
            Unit
          </option>
          <option value="none">none</option>
          <option value="reps">reps</option>
          <option value="sec">sec</option>
          <option value="min">min</option>
          <option value="rounds">rounds</option>
          <option value="meters">meters</option>
        </select>

        <button className="btn-primary" type="submit">
          Add Activity
        </button>
      </form>

      <button className="btn-secondary btn-utility" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
