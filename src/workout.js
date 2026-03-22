export function toISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(date) {
  return new Date(date + "T00:00:00");
}

export function daysBetween(from, to) {
  const a = parseISODate(from);
  const b = parseISODate(to);
  return Math.round((b - a) / 86_400_000);
}

export function addDays(date, days) {
  const dt = parseISODate(date);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function getPeriodDays(activity) {
  const period = Math.max(1, Number(activity.period) || 1);
  return activity.periodUnit === "week" ? period * 7 : period;
}

export function isActivityActiveOnDate(activity, date) {
  if (daysBetween(activity.effectiveStartDate, date) < 0) return false;
  if (activity.archivedAt && daysBetween(date, activity.archivedAt) <= -1) return false;
  return true;
}

export function isActivityDueOnDate(activity, date) {
  if (!isActivityActiveOnDate(activity, date)) return false;
  const diff = daysBetween(activity.effectiveStartDate, date);
  const periodDays = getPeriodDays(activity);
  return diff % periodDays === 0;
}

export function getActivityTarget(activity, date) {
  if (!isActivityDueOnDate(activity, date)) return null;
  const diff = daysBetween(activity.effectiveStartDate, date);
  const periodDays = getPeriodDays(activity);
  const step = Math.floor(diff / periodDays);
  return Math.max(0, Number(activity.startValue) + step * Number(activity.increase));
}

export function getDueActivities(activities, date) {
  return activities
    .filter((activity) => isActivityDueOnDate(activity, date))
    .map((activity) => ({
      ...activity,
      targetValue: getActivityTarget(activity, date),
    }));
}

export function isDateComplete(dueActivities, completionMap) {
  if (dueActivities.length === 0) return true;
  return dueActivities.every((activity) => completionMap[activity.id]?.completed);
}

export function computeCurrentStreak(today, activities, completionsByDate) {
  return computeCurrentStreakSince(today, activities, completionsByDate, null);
}

export function computeCurrentStreakSince(today, activities, completionsByDate, cutoffDate) {
  let streak = 0;
  for (let offset = 0; offset < 3650; offset += 1) {
    const date = addDays(today, -offset);
    if (cutoffDate && daysBetween(cutoffDate, date) <= 0) {
      break;
    }
    const due = getDueActivities(activities, date);
    if (due.length === 0) {
      continue;
    }
    const completionMap = completionsByDate[date] || {};
    if (!isDateComplete(due, completionMap)) {
      if (offset === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

export function findRecentMissState(today, activities, completionsByDate) {
  return findRecentMissStateSince(today, activities, completionsByDate, null);
}

export function findRecentMissStateSince(
  today,
  activities,
  completionsByDate,
  cutoffDate
) {
  const dueDates = [];
  for (let offset = 1; offset <= 60; offset += 1) {
    const date = addDays(today, -offset);
    if (cutoffDate && daysBetween(cutoffDate, date) <= 0) {
      break;
    }
    const due = getDueActivities(activities, date);
    if (due.length > 0) dueDates.push({ date, due });
  }

  if (dueDates.length === 0) {
    return { missCount: 0, latestMissDate: null };
  }

  let missCount = 0;
  let latestMissDate = null;
  for (const { date, due } of dueDates) {
    const completionMap = completionsByDate[date] || {};
    const complete = isDateComplete(due, completionMap);
    if (!complete) {
      missCount += 1;
      if (!latestMissDate) latestMissDate = date;
    } else {
      break;
    }
  }

  return { missCount, latestMissDate };
}

export function formatPlank(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatLifetimePlank(totalSecs) {
  if (totalSecs < 60) return `${totalSecs}s`;
  const m = Math.floor(totalSecs / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
}
