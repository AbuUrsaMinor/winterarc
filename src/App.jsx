import { useEffect, useMemo, useRef, useState } from "react";
import {
  archiveActivity,
  deleteCompletion,
  ensureSeedData,
  getAppMeta,
  getActivities,
  getAllCompletions,
  getStreakData,
  getNotificationSettings,
  resetStreak,
  saveActivity,
  saveCompletion,
  saveNotificationSettings,
  saveStreakData,
} from "./db.js";
import ActivitySettingsScreen from "./screens/ActivitySettingsScreen.jsx";
import CompletionScreen from "./screens/CompletionScreen.jsx";
import FreezeScreen from "./screens/FreezeScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import ShameScreen from "./screens/ShameScreen.jsx";
import {
  addDays,
  computeCurrentStreakSince,
  daysBetween,
  findRecentMissStateSince,
  formatLifetimePlank,
  getDueActivities,
  isDateComplete,
  toISODate,
} from "./workout.js";

const BULLY_MESSAGES = [
  "You had ONE job. ONE. And you blew it. Welcome back to Day 1, quitter.",
  "Wow. Even your streak couldn't stand you. Starting over like the amateur you are.",
  "Classic. The arc waits for no one — especially not you. Day 1. Again.",
  "Your future self is embarrassed. Day 1. Try not to mess it up this time.",
  "The cold doesn't take days off. Unfortunately, you do. Back to the beginning.",
  "A whole streak, wasted. Absolutely shameful. Day 1 is calling your name.",
  "Did life get 'too busy'? The push-up doesn't care. Neither does this app. Reset.",
  "You broke the arc. The arc is disappointed. Back to square one, champ.",
];

function randomBully() {
  return BULLY_MESSAGES[Math.floor(Math.random() * BULLY_MESSAGES.length)];
}

function maxDate(...dates) {
  const validDates = dates.filter(Boolean).sort((a, b) => a.localeCompare(b));
  return validDates[validDates.length - 1] || null;
}

function formatReminderHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [activities, setActivities] = useState([]);
  const [completionsByDate, setCompletionsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(toISODate());
  const [appMeta, setAppMeta] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [freezeData, setFreezeData] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [shameData, setShameData] = useState(null);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [timerState, setTimerState] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState({
    reminderHour: 20,
    lastNotifiedDate: null,
  });
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const timerRef = useRef(null);

  const today = toISODate();
  const dueActivities = useMemo(
    () => getDueActivities(activities, selectedDate),
    [activities, selectedDate]
  );
  const completionMap = completionsByDate[selectedDate] || {};
  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (screen === "loading") return undefined;
    const interval = setInterval(() => {
      updateNotificationsState(activities, completionsByDate).catch(() => null);
    }, 60_000);
    return () => clearInterval(interval);
  }, [activities, completionsByDate, notificationPermission, screen]);

  useEffect(() => {
    if (!timerState) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((timerState.endsAt - Date.now()) / 1000)
      );
      setTimerRemaining(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        handleToggleCompletion(timerState.activity, true, timerState.date);
        setTimerState(null);
      }
    }, 250);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [timerState]);

  async function boot() {
    await ensureSeedData(today);
    await refreshState({ preferredDate: today, initial: true });
  }

  function mapCompletionsByDate(all) {
    const grouped = {};
    for (const completion of all) {
      if (!grouped[completion.date]) grouped[completion.date] = {};
      grouped[completion.date][completion.activityId] = completion;
    }
    return grouped;
  }

  async function updateNotificationsState(currentActivities, currentCompletionsByDate) {
    const settings = await getNotificationSettings();
    const now = new Date();
    const currentDate = toISODate(now);
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dueToday = getDueActivities(currentActivities, currentDate);
    const completeToday = isDateComplete(
      dueToday,
      currentCompletionsByDate[currentDate] || {}
    );
    const shouldShowBadge = dueToday.length > 0 && !completeToday;

    if (navigator.setAppBadge && shouldShowBadge) {
      await navigator.setAppBadge(1);
    }

    if (navigator.clearAppBadge && !shouldShowBadge) {
      await navigator.clearAppBadge();
    }

    const shouldNotify =
      hour >= settings.reminderHour &&
      !completeToday &&
      settings.lastNotifiedDate !== currentDate &&
      notificationPermission === "granted";

    if (shouldNotify) {
      new Notification("Winter Arc check-in", {
        body: `It is ${formatReminderHour(settings.reminderHour)}. Complete your due activities for today.`,
        icon: `${import.meta.env.BASE_URL}icon-192.png`,
        badge: `${import.meta.env.BASE_URL}icon-192.png`,
      });
      await saveNotificationSettings({ ...settings, lastNotifiedDate: currentDate });
      setNotificationSettings({ ...settings, lastNotifiedDate: currentDate });
    }

    if (
      notificationPermission === "granted" &&
      hour === settings.reminderHour &&
      minute < 1 &&
      settings.lastNotifiedDate !== currentDate
    ) {
      const nextSettings = { ...settings, lastNotifiedDate: currentDate };
      await saveNotificationSettings(nextSettings);
      setNotificationSettings(nextSettings);
    }
  }

  async function refreshState({ preferredDate = selectedDate, initial = false } = {}) {
    const [loadedActivities, allCompletions, streak, loadedAppMeta, loadedNotificationSettings] = await Promise.all([
      getActivities(),
      getAllCompletions(),
      getStreakData(),
      getAppMeta(),
      getNotificationSettings(),
    ]);

    const byDate = mapCompletionsByDate(allCompletions);
    const historyBoundary = maxDate(
      streak.resetCommittedAt || null,
      loadedAppMeta.createdAt ? addDays(loadedAppMeta.createdAt, -1) : null
    );
    const missState = findRecentMissStateSince(
      today,
      loadedActivities,
      byDate,
      historyBoundary
    );
    const computedStreak = computeCurrentStreakSince(
      today,
      loadedActivities,
      byDate,
      historyBoundary
    );

    const nextBest = Math.max(streak.bestStreak, computedStreak);
    const earnedFreeze =
      computedStreak > 0 &&
      computedStreak !== streak.currentStreak &&
      computedStreak % 5 === 0 &&
      streak.freezeInventory === 0;

    const nextStreak = {
      ...streak,
      currentStreak: computedStreak,
      bestStreak: nextBest,
      freezeInventory: earnedFreeze ? 1 : streak.freezeInventory,
    };
    await saveStreakData(nextStreak);

    setActivities(loadedActivities);
    setAppMeta(loadedAppMeta);
    setCompletionsByDate(byDate);
    setStreakData(nextStreak);
    setNotificationSettings(loadedNotificationSettings);

    const clampedDate = preferredDate > today ? today : preferredDate;
    setSelectedDate(clampedDate);

    if (missState.missCount > 1) {
      await resetStreak(today);
      setShameData({ deadStreak: nextStreak.currentStreak, message: randomBully() });
      setScreen("shame");
      return;
    }

    if (missState.missCount === 1 && initial) {
      setFreezeData({ missedDate: missState.latestMissDate });
      setScreen("freeze");
    } else if (screen === "loading" || initial) {
      setFreezeData(null);
      setScreen("home");
    }

    await updateNotificationsState(loadedActivities, byDate);
  }

  function countCompletedDates(currentActivities, byDate, createdAt) {
    if (currentActivities.length === 0) return 0;
    const earliestActivityDate = currentActivities
      .map((a) => a.effectiveStartDate)
      .sort((a, b) => a.localeCompare(b))[0];
    const start = maxDate(createdAt, earliestActivityDate);

    if (!start || Number.isNaN(Date.parse(`${start}T00:00:00`))) {
      return 0;
    }

    const daySpan = Math.max(0, Math.min(3650, daysBetween(start, today)));

    let count = 0;
    for (let offset = 0; offset <= daySpan; offset += 1) {
      const current = addDays(start, offset);
      const due = getDueActivities(currentActivities, current);
      if (due.length > 0 && isDateComplete(due, byDate[current] || {})) count += 1;
    }
    return count;
  }

  function buildCompletionStats(currentActivities, byDate, streak, createdAt) {
    const allCompletions = Object.values(byDate).flatMap((items) => Object.values(items));
    const activityById = currentActivities.reduce((acc, activity) => {
      acc[activity.id] = activity;
      return acc;
    }, {});
    const totals = allCompletions.reduce((acc, completion) => {
      if (!completion.completed) return acc;
      acc[completion.activityId] = (acc[completion.activityId] || 0) + completion.targetValue;
      return acc;
    }, {});

    const totalsByActivity = Object.entries(totals)
      .map(([activityId, total]) => {
        const activity = activityById[activityId];
        if (!activity) return null;

        const value =
          activity.isTimer && activity.unitLabel === "sec"
            ? formatLifetimePlank(total)
            : activity.unitLabel
              ? `${total.toLocaleString()} ${activity.unitLabel}`
              : total.toLocaleString();

        return {
          id: activityId,
          label: activity.name,
          value,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      freezeInventory: streak.freezeInventory,
      totalCompletedDates: countCompletedDates(currentActivities, byDate, createdAt),
      totalsByActivity,
    };
  }

  async function handleToggleCompletion(activity, shouldComplete, dateOverride) {
    const date = dateOverride || selectedDate;
    const id = `${date}:${activity.id}`;
    if (!shouldComplete) {
      await deleteCompletion(id);
    } else {
      await saveCompletion({
        id,
        date,
        activityId: activity.id,
        targetValue: activity.targetValue,
        completed: true,
        completedAt: new Date().toISOString(),
      });
    }

    await refreshState({ preferredDate: date });
    const refreshedDue = getDueActivities(activities, date);
    const refreshedMap = (await getAllCompletions())
      .filter((row) => row.date === date)
      .reduce((acc, row) => {
        acc[row.activityId] = row;
        return acc;
      }, {});

    if (isDateComplete(refreshedDue, refreshedMap)) {
      const nextStats = buildCompletionStats(
        activities,
        { ...completionsByDate, [date]: refreshedMap },
        await getStreakData(),
        appMeta?.createdAt || today
      );
      setCompletionData(nextStats);
      setFreezeUsed(false);
      setScreen("completion");
    }
  }

  function handleStartTimer(activity) {
    if (timerState) return;
    const current = completionMap[activity.id];
    if (current?.completed) return;
    const seconds = Number(activity.targetValue) || 0;
    setTimerRemaining(seconds);
    setTimerState({
      activity,
      date: selectedDate,
      endsAt: Date.now() + seconds * 1000,
    });
  }

  async function handleUseFreeze() {
    if (!freezeData || !streakData || streakData.freezeInventory <= 0) return;
    const missedDate = freezeData.missedDate;
    const due = getDueActivities(activities, missedDate);
    for (const activity of due) {
      await saveCompletion({
        id: `${missedDate}:${activity.id}`,
        date: missedDate,
        activityId: activity.id,
        targetValue: activity.targetValue,
        completed: true,
        completedAt: new Date().toISOString(),
        frozen: true,
      });
    }

    await saveStreakData({
      ...streakData,
      freezeInventory: 0,
      freezesUsed: streakData.freezesUsed + 1,
    });

    setFreezeUsed(true);
    await refreshState({ preferredDate: today, initial: true });
    setScreen("home");
  }

  function handleBackfillMissedDate() {
    if (!freezeData) return;
    setSelectedDate(freezeData.missedDate);
    setScreen("home");
  }

  async function handleGiveUp() {
    const streak = await getStreakData();
    await resetStreak(today);
    setShameData({ deadStreak: streak.currentStreak, message: randomBully() });
    setScreen("shame");
  }

  async function handleShameComplete() {
    await refreshState({ preferredDate: today, initial: true });
    setScreen("home");
  }

  async function handleViewStats() {
    const stats = buildCompletionStats(
      activities,
      completionsByDate,
      streakData,
      appMeta?.createdAt || today
    );
    setCompletionData(stats);
    setFreezeUsed(false);
    setScreen("completion");
  }

  function handleBackFromCompletion() {
    setScreen("home");
  }

  async function handleSaveActivity(activity) {
    await saveActivity(activity);
    await refreshState({ preferredDate: selectedDate });
  }

  async function handleArchiveActivity(id) {
    await archiveActivity(id, selectedDate);
    await refreshState({ preferredDate: selectedDate });
  }

  async function handleEnableNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    await refreshState({ preferredDate: selectedDate });
  }

  async function handleReminderHourChange(reminderHour) {
    const nextSettings = {
      ...notificationSettings,
      reminderHour,
    };
    await saveNotificationSettings(nextSettings);
    setNotificationSettings(nextSettings);
    await updateNotificationsState(activities, completionsByDate);
  }

  function handlePrevDate() {
    setSelectedDate(addDays(selectedDate, -1));
  }

  function handleNextDate() {
    const next = addDays(selectedDate, 1);
    setSelectedDate(next > today ? today : next);
  }

  if (screen === "loading") {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (screen === "home") {
    return (
      <HomeScreen
        selectedDate={selectedDate}
        today={today}
        dueActivities={dueActivities}
        completionMap={completionMap}
        timerState={timerState}
        timerRemaining={timerRemaining}
        currentStreak={streakData?.currentStreak || 0}
        freezeInventory={streakData?.freezeInventory || 0}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToggleCompletion={handleToggleCompletion}
        onStartTimer={handleStartTimer}
        onOpenSettings={() => setScreen("settings")}
        onViewStats={handleViewStats}
      />
    );
  }

  if (screen === "freeze") {
    if (!freezeData) {
      return (
        <div className="loading">
          <div className="spinner" />
        </div>
      );
    }
    return (
      <FreezeScreen
        missedDate={freezeData.missedDate}
        freezeInventory={streakData?.freezeInventory || 0}
        onUseFreeze={handleUseFreeze}
        onBackfill={handleBackfillMissedDate}
        onGiveUp={handleGiveUp}
      />
    );
  }

  if (screen === "completion") {
    if (!completionData) {
      return (
        <div className="loading">
          <div className="spinner" />
        </div>
      );
    }
    return (
      <CompletionScreen
        stats={completionData}
        freezeUsed={freezeUsed}
        selectedDate={selectedDate}
        onBack={handleBackFromCompletion}
      />
    );
  }

  if (screen === "settings") {
    return (
      <ActivitySettingsScreen
        activities={activities}
        selectedDate={selectedDate}
        notificationSettings={notificationSettings}
        notificationPermission={notificationPermission}
        onEnableNotifications={handleEnableNotifications}
        onReminderHourChange={handleReminderHourChange}
        onSave={handleSaveActivity}
        onArchive={handleArchiveActivity}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "shame") {
    if (!shameData) {
      return (
        <div className="loading">
          <div className="spinner" />
        </div>
      );
    }
    return (
      <ShameScreen
        message={shameData.message}
        deadStreak={shameData.deadStreak}
        onContinue={handleShameComplete}
      />
    );
  }

  return null;
}
