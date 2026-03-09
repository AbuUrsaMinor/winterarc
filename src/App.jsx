import { useState, useEffect } from 'react'
import {
  getLastWorkout,
  saveWorkout,
  getStreakData,
  saveStreakData,
  getAllWorkouts,
  resetStreak,
} from './db.js'
import { getTargets, toISODate, daysBetween, formatLifetimePlank } from './workout.js'
import HomeScreen from './screens/HomeScreen.jsx'
import FreezeScreen from './screens/FreezeScreen.jsx'
import CompletionScreen from './screens/CompletionScreen.jsx'
import ShameScreen from './screens/ShameScreen.jsx'

const BULLY_MESSAGES = [
  "You had ONE job. ONE. And you blew it. Welcome back to Day 1, quitter.",
  "Wow. Even your streak couldn't stand you. Starting over like the amateur you are.",
  "Classic. The arc waits for no one — especially not you. Day 1. Again.",
  "Your future self is embarrassed. Day 1. Try not to mess it up this time.",
  "The cold doesn't take days off. Unfortunately, you do. Back to the beginning.",
  "A whole streak, wasted. Absolutely shameful. Day 1 is calling your name.",
  "Did life get 'too busy'? The push-up doesn't care. Neither does this app. Reset.",
  "You broke the arc. The arc is disappointed. Back to square one, champ.",
]

function randomBully() {
  return BULLY_MESSAGES[Math.floor(Math.random() * BULLY_MESSAGES.length)]
}

async function computeStats() {
  const [all, streak] = await Promise.all([getAllWorkouts(), getStreakData()])
  const totalPushups = all.reduce((s, w) => s + w.pushups, 0)
  const totalSitups = all.reduce((s, w) => s + w.situps, 0)
  const totalPlankSecs = all.reduce((s, w) => s + w.plankSecs, 0)
  const bestDay = all.reduce((m, w) => Math.max(m, w.day), 0)
  return {
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    freezesUsed: streak.freezesUsed,
    totalWorkouts: all.length,
    totalPushups,
    totalSitups,
    totalPlankSecs,
    bestDay: bestDay || 1,
  }
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [currentDay, setCurrentDay] = useState(1)
  const [freezeData, setFreezeData] = useState(null)
  const [completionData, setCompletionData] = useState(null)
  const [shameData, setShameData] = useState(null)
  const [freezeUsed, setFreezeUsed] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const today = toISODate()
    const [last, streak] = await Promise.all([getLastWorkout(), getStreakData()])

    if (!last) {
      setCurrentDay(1)
      setScreen('home')
      return
    }

    const gap = daysBetween(last.date, today)

    if (gap === 0) {
      setCurrentDay(last.day)
      setScreen('done_today')
    } else if (gap === 1) {
      setCurrentDay(last.day + 1)
      setScreen('home')
    } else if (gap === 2) {
      setFreezeData({ yesterdayDay: last.day + 1, todayDay: last.day + 2 })
      setScreen('freeze')
    } else {
      // 2+ missed days — save best streak, reset, show shame
      const newBest = Math.max(streak.bestStreak, streak.currentStreak)
      await saveStreakData({ ...streak, bestStreak: newBest, currentStreak: 0, startDate: null })
      setShameData({ deadStreak: streak.currentStreak, message: randomBully() })
      setScreen('shame')
    }
  }

  async function handleComplete() {
    const today = toISODate()
    const targets = getTargets(currentDay)
    await saveWorkout({ date: today, day: currentDay, ...targets, completedAt: new Date().toISOString() })

    const streak = await getStreakData()
    const newStreak = streak.currentStreak + 1
    const newBest = Math.max(streak.bestStreak, newStreak)
    await saveStreakData({ ...streak, currentStreak: newStreak, bestStreak: newBest, startDate: streak.startDate || today })

    const stats = await computeStats()
    setCompletionData(stats)
    setFreezeUsed(false)
    setScreen('completion')
  }

  async function handleMakeItRight() {
    const today = toISODate()
    const yesterday = toISODate(new Date(Date.now() - 86_400_000))
    const { yesterdayDay, todayDay } = freezeData
    const yTargets = getTargets(yesterdayDay)
    const tTargets = getTargets(todayDay)

    await saveWorkout({ date: yesterday, day: yesterdayDay, ...yTargets, completedAt: new Date().toISOString() })
    await saveWorkout({ date: today, day: todayDay, ...tTargets, completedAt: new Date().toISOString() })

    const streak = await getStreakData()
    const newStreak = streak.currentStreak + 2
    const newBest = Math.max(streak.bestStreak, newStreak)
    await saveStreakData({
      ...streak,
      currentStreak: newStreak,
      bestStreak: newBest,
      freezesUsed: streak.freezesUsed + 1,
      startDate: streak.startDate || yesterday,
    })

    const stats = await computeStats()
    setCompletionData(stats)
    setFreezeUsed(true)
    setCurrentDay(todayDay)
    setScreen('completion')
  }

  async function handleGiveUp() {
    const streak = await getStreakData()
    const newBest = Math.max(streak.bestStreak, streak.currentStreak)
    await saveStreakData({ ...streak, bestStreak: newBest, currentStreak: 0, startDate: null })
    setShameData({ deadStreak: streak.currentStreak, message: randomBully() })
    setScreen('shame')
  }

  async function handleShameComplete() {
    await resetStreak()
    setCurrentDay(1)
    setScreen('home')
  }

  async function handleViewStats() {
    const stats = await computeStats()
    setCompletionData(stats)
    setFreezeUsed(false)
    setScreen('completion')
  }

  function handleBackFromCompletion() {
    setScreen('done_today')
  }

  if (screen === 'loading') {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  if (screen === 'home' || screen === 'done_today') {
    return (
      <HomeScreen
        day={currentDay}
        alreadyDone={screen === 'done_today'}
        onComplete={handleComplete}
        onViewStats={handleViewStats}
      />
    )
  }

  if (screen === 'freeze') {
    return (
      <FreezeScreen
        yesterdayDay={freezeData.yesterdayDay}
        todayDay={freezeData.todayDay}
        onMakeItRight={handleMakeItRight}
        onGiveUp={handleGiveUp}
      />
    )
  }

  if (screen === 'completion') {
    return (
      <CompletionScreen
        stats={completionData}
        freezeUsed={freezeUsed}
        onBack={handleBackFromCompletion}
      />
    )
  }

  if (screen === 'shame') {
    return (
      <ShameScreen
        message={shameData.message}
        deadStreak={shameData.deadStreak}
        onContinue={handleShameComplete}
      />
    )
  }

  return null
}
