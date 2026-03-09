# Winter Arc — PWA Specifications

## Overview

**Winter Arc** is a Progressive Web App (PWA) for a daily bodyweight training program. The app tracks a linearly progressive workout routine consisting of push-ups, sit-ups, and a plank hold. It is designed to be installed on mobile and desktop devices, work offline, and store all data locally using IndexedDB.

---

## Training Program Logic

### Starting Values (Day 1)

| Exercise  | Amount     |
|-----------|------------|
| Push-ups  | 1 rep      |
| Sit-ups   | 1 rep      |
| Plank     | 30 seconds |

### Daily Progression

Each day the targets increase by:

| Exercise  | Daily Increase |
|-----------|----------------|
| Push-ups  | +1 rep         |
| Sit-ups   | +1 rep         |
| Plank     | +5 seconds     |

### Formula

For any given day `n` (starting at day 1):

- Push-ups = `n`
- Sit-ups = `n`
- Plank = `30 + (n - 1) * 5` seconds

---

## Streak Rules

### Normal Streak

- Complete your workout each calendar day to maintain the streak
- The streak counter increments by 1 after each completion

### Broken Streak — Freeze Mechanic

If the user **misses exactly 1 day**, they may perform a **Streak Freeze** to avoid losing progress:

- They must complete **both yesterday's targets AND today's targets** in a single session
- This counts as two workouts logged back-to-back
- The streak is preserved and the day counter continues as if no day was missed
- Only **one consecutive missed day** is recoverable — miss 2 or more days and the program resets to Day 1

### Broken Streak — No Freeze Applied

If the user misses more than 1 day, or opens the app after a single missed day and presses "I Give Up — Reset" instead of recovering:

- All progress resets: day counter returns to 1, streak resets to 0
- Previous workout history is retained in IndexedDB for stats, but does not count toward the active streak
- The app **roasts the user** with a randomly selected bully message (see below)

### Streak Break Bully Messages

Displayed on a dedicated "Shame Screen" when the streak is officially broken:

1. *"You had ONE job. ONE. And you blew it. Welcome back to Day 1, quitter."*
2. *"Wow. Even your streak couldn't stand you. Starting over like the amateur you are."*
3. *"Classic. The arc waits for no one — especially not you. Day 1. Again."*
4. *"Your future self is embarrassed. Day 1. Try not to mess it up this time."*
5. *"The cold doesn't take days off. Unfortunately, you do. Back to the beginning."*
6. *"A whole streak, wasted. Absolutely shameful. Day 1 is calling your name."*
7. *"Did life get 'too busy'? The push-up doesn't care. Neither does this app. Reset."*
8. *"You broke the arc. The arc is disappointed. Back to square one, champ."*

A "Continue" button dismisses the Shame Screen and loads the Day 1 workout.

---

## App Screens & Flow

### 1. Home / Today's Workout Screen

- Displayed on app open
- Shows the **current day number** (e.g. "Day 7")
- Displays today's targets clearly:
  - Push-ups: X reps
  - Sit-ups: X reps
  - Plank: X seconds
- A prominent **"Done for Today"** button to log completion
- If today's workout has already been completed, the button is disabled/hidden and a "Already crushed it today" message is shown instead

### 1b. Streak Freeze Screen (shown when app is opened after exactly 1 missed day)

- Displayed instead of the normal Home screen
- Informs the user they missed yesterday
- Shows the **combined targets** for both yesterday and today
- Shows a **"Make It Right"** button — completing this logs both days and preserves the streak
- Shows a secondary **"I Give Up — Reset"** button that triggers the Shame Screen and resets to Day 1

### 2. Completion Screen (shown after pressing "Done for Today" or "Make It Right")

- Congratulates the user
- If a Streak Freeze was just used, adds a special callout: *"Streak saved — don't let it happen again."*
- Displays:
  - **Current streak** — consecutive days completed without missing a day
  - **Total workouts completed**
  - **Lifetime totals** — total push-ups, sit-ups, and plank time accumulated
  - **Personal bests** — highest single-day reps/plank time reached
- A button to return to the Home screen

### 3. Shame Screen (shown when streak is broken with no freeze)

- Full-screen dark overlay with red tint
- Displays one of the bully messages (randomly selected)
- Shows the user's now-dead streak number: *"You had a X-day streak. Had."*
- A "Continue" button that loads the Day 1 workout

---

## Data Storage — IndexedDB

All data is stored locally using the browser's **IndexedDB** API. No backend or server required.

### Object Store: `workouts`

Each completed workout session is stored as a record:

| Field        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `date`       | string   | ISO date string (e.g. `"2026-03-09"`) — used as primary key |
| `day`        | number   | Program day number (1, 2, 3, …)      |
| `pushups`    | number   | Number of push-ups completed         |
| `situps`     | number   | Number of sit-ups completed          |
| `plankSecs`  | number   | Plank duration in seconds            |
| `completedAt`| string   | ISO timestamp of completion          |

### Object Store: `streaks`

Tracks the current active streak session:

| Field           | Type     | Description                                       |
|-----------------|----------|---------------------------------------------------|
| `id`            | number   | Always `1` — single record                       |
| `startDate`     | string   | ISO date when current streak began               |
| `currentStreak` | number   | Number of days in the current active streak      |
| `bestStreak`    | number   | Highest streak ever reached                      |
| `freezesUsed`   | number   | Total number of streak freezes ever used         |

### Derived Statistics (computed from stored records)

- **Current streak**: from the `streaks` store `currentStreak` field
- **Total workouts**: total number of records in the `workouts` store
- **Lifetime push-ups / sit-ups / plank seconds**: sum of all records across all sessions
- **Best streak**: `bestStreak` from the `streaks` store
- **Best day**: the record with the highest `day` value
- **Missed day detection**: on app open, compare last workout date to today — if gap === 1 day → offer Streak Freeze screen; if gap > 1 day → Shame Screen + reset to Day 1

---

## PWA Requirements

- `manifest.json` with app name, icons, theme color, and `display: standalone`
- Service Worker with offline caching (cache-first strategy for static assets)
- Installable on Android, iOS, and desktop Chrome/Edge
- App icon: custom SVG (source at `public/icon.svg`) + PNG exports at 192×192 and 512×512
- Icon design: deep navy rounded-square background, bold icy arc gradient (dark blue → ice blue → white → ice blue → dark blue), snowflake motif center, star/snow particle accents

---

## UI / Design Guidelines

- **Theme**: Dark mode, cold winter palette — deep navy/black backgrounds, icy blue and white accents
- **Typography**: Bold, clear fonts — readability is key for workout numbers
- **Layout**: Mobile-first, single-column, large tap targets
- **Animations**: Subtle — a clean fade or slide when transitioning to the completion screen
- **Shame Screen**: red-tinged dark background, harsh heavy font, no friendly colours — feel punishing
- **Streak Freeze Screen**: amber/warning tone — signals urgency without full shame

---

## Out of Scope (v1)

- User accounts or cloud sync
- Multiple users on the same device
- Rest day scheduling
- Push notifications (may be added in v2)
- Custom exercise targets

---

## Tech Stack

| Concern         | Choice                     |
|-----------------|----------------------------|
| Framework       | React + Vite               |
| Styling         | CSS Modules or Tailwind    |
| Storage         | IndexedDB (via `idb` lib)  |
| PWA             | Vite PWA plugin (`vite-plugin-pwa`) |
| Deployment      | GitHub Pages               |
