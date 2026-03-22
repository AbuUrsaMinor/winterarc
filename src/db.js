import { openDB } from "idb";

const DEFAULT_ACTIVITIES = [
  {
    id: "pushups",
    name: "Push-ups",
    emoji: "💪",
    startValue: 1,
    increase: 1,
    period: 1,
    periodUnit: "day",
    unitLabel: "reps",
  },
  {
    id: "situps",
    name: "Sit-ups",
    emoji: "🔥",
    startValue: 1,
    increase: 1,
    period: 1,
    periodUnit: "day",
    unitLabel: "reps",
  },
  {
    id: "plank",
    name: "Plank",
    emoji: "⏱",
    startValue: 30,
    increase: 5,
    period: 1,
    periodUnit: "day",
    unitLabel: "sec",
    isTimer: true,
  },
];

const DEFAULT_STREAK = {
  id: 1,
  startDate: null,
  currentStreak: 0,
  bestStreak: 0,
  freezesUsed: 0,
  freezeInventory: 0,
  resetCommittedAt: null,
};

const DEFAULT_APP_META = {
  id: "appMeta",
  createdAt: null,
  legacyWorkoutsMigrated: false,
};

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB("winterarc", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("workouts", { keyPath: "date" });
          db.createObjectStore("streaks", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("activities")) {
          db.createObjectStore("activities", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("activityCompletions")) {
          const completions = db.createObjectStore("activityCompletions", {
            keyPath: "id",
          });
          completions.createIndex("byDate", "date");
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function ensureSeedData(programStartDate) {
  const db = await getDB();
  const tx = db.transaction(
    ["activities", "streaks", "settings", "activityCompletions", "workouts"],
    "readwrite"
  );

  const activitiesCount = await tx.objectStore("activities").count();
  if (activitiesCount === 0) {
    for (const activity of DEFAULT_ACTIVITIES) {
      await tx.objectStore("activities").put({
        ...activity,
        effectiveStartDate: programStartDate,
        archivedAt: null,
      });
    }
  }

  const streak = await tx.objectStore("streaks").get(1);
  if (!streak) {
    await tx.objectStore("streaks").put(DEFAULT_STREAK);
  } else {
    await tx.objectStore("streaks").put({ ...DEFAULT_STREAK, ...streak });
  }

  const notifications = await tx.objectStore("settings").get("notifications");
  if (!notifications) {
    await tx.objectStore("settings").put({
      id: "notifications",
      reminderHour: 20,
      lastNotifiedDate: null,
    });
  }

  const workouts = await tx.objectStore("workouts").getAll();
  const earliestWorkoutDate = workouts
    .map((workout) => workout.date)
    .sort((a, b) => a.localeCompare(b))[0] || null;

  const appMeta = await tx.objectStore("settings").get("appMeta");
  const nextAppMeta = {
    ...DEFAULT_APP_META,
    ...(appMeta || {}),
    createdAt:
      appMeta?.createdAt || earliestWorkoutDate || programStartDate,
  };

  if (!nextAppMeta.legacyWorkoutsMigrated && workouts.length > 0) {
    const completionsStore = tx.objectStore("activityCompletions");
    for (const workout of workouts) {
      const migratedRecords = [
        {
          id: `${workout.date}:pushups`,
          date: workout.date,
          activityId: "pushups",
          targetValue: workout.pushups,
          completed: true,
          completedAt: workout.completedAt,
        },
        {
          id: `${workout.date}:situps`,
          date: workout.date,
          activityId: "situps",
          targetValue: workout.situps,
          completed: true,
          completedAt: workout.completedAt,
        },
        {
          id: `${workout.date}:plank`,
          date: workout.date,
          activityId: "plank",
          targetValue: workout.plankSecs,
          completed: true,
          completedAt: workout.completedAt,
        },
      ];

      for (const record of migratedRecords) {
        const existing = await completionsStore.get(record.id);
        if (!existing) {
          await completionsStore.put(record);
        }
      }
    }
    nextAppMeta.legacyWorkoutsMigrated = true;
  } else if (!nextAppMeta.legacyWorkoutsMigrated) {
    nextAppMeta.legacyWorkoutsMigrated = true;
  }

  await tx.objectStore("settings").put(nextAppMeta);

  await tx.done;
}

export async function getActivities() {
  const db = await getDB();
  const all = await db.getAll("activities");
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveActivity(activity) {
  const db = await getDB();
  return db.put("activities", activity);
}

export async function archiveActivity(id, archivedAt) {
  const db = await getDB();
  const current = await db.get("activities", id);
  if (!current) return;
  return db.put("activities", { ...current, archivedAt });
}

export async function getCompletionsByDate(date) {
  const db = await getDB();
  return db.getAllFromIndex("activityCompletions", "byDate", date);
}

export async function saveCompletion(record) {
  const db = await getDB();
  return db.put("activityCompletions", record);
}

export async function deleteCompletion(completionId) {
  const db = await getDB();
  return db.delete("activityCompletions", completionId);
}

export async function getAllCompletions() {
  const db = await getDB();
  return db.getAll("activityCompletions");
}

export async function getAllWorkouts() {
  const db = await getDB();
  return db.getAll("workouts");
}

export async function getStreakData() {
  const db = await getDB();
  const data = await db.get("streaks", 1);
  return { ...DEFAULT_STREAK, ...(data || {}) };
}

export async function saveStreakData(data) {
  const db = await getDB();
  return db.put("streaks", { ...DEFAULT_STREAK, ...data });
}

export async function resetStreak(committedAt) {
  const current = await getStreakData();
  return saveStreakData({
    ...current,
    currentStreak: 0,
    startDate: null,
    freezeInventory: 0,
    resetCommittedAt: committedAt,
  });
}

export async function getNotificationSettings() {
  const db = await getDB();
  const settings = await db.get("settings", "notifications");
  return settings || { id: "notifications", reminderHour: 20, lastNotifiedDate: null };
}

export async function getAppMeta() {
  const db = await getDB();
  const appMeta = await db.get("settings", "appMeta");
  return { ...DEFAULT_APP_META, ...(appMeta || {}) };
}

export async function saveNotificationSettings(settings) {
  const db = await getDB();
  return db.put("settings", { id: "notifications", reminderHour: 20, ...settings });
}
