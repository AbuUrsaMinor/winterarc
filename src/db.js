import { openDB } from 'idb'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('winterarc', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'date' })
        }
        if (!db.objectStoreNames.contains('streaks')) {
          db.createObjectStore('streaks', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getLastWorkout() {
  const db = await getDB()
  const all = await db.getAll('workouts')
  if (!all.length) return null
  return all.sort((a, b) => b.date.localeCompare(a.date))[0]
}

export async function saveWorkout(record) {
  const db = await getDB()
  return db.put('workouts', record)
}

export async function getAllWorkouts() {
  const db = await getDB()
  return db.getAll('workouts')
}

export async function getStreakData() {
  const db = await getDB()
  const data = await db.get('streaks', 1)
  return data || { id: 1, startDate: null, currentStreak: 0, bestStreak: 0, freezesUsed: 0 }
}

export async function saveStreakData(data) {
  const db = await getDB()
  return db.put('streaks', data)
}

export async function resetStreak() {
  const db = await getDB()
  const current = await getStreakData()
  return db.put('streaks', { ...current, currentStreak: 0, startDate: null })
}
