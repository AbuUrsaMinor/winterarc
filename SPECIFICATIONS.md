# Winter Arc — PWA Specifications

## Overview

**Winter Arc** is a Progressive Web App (PWA) for a daily bodyweight training program. The app tracks a linearly progressive workout routine consisting of push-ups, sit-ups, and a plank hold. It is designed to be installed on mobile and desktop devices, work offline, and store all data locally using IndexedDB.

---

## Training Program Logic

### Starting Values (Day 1)

| Exercise | Amount     |
| -------- | ---------- |
| Push-ups | 1 rep      |
| Sit-ups  | 1 rep      |
| Plank    | 30 seconds |

### Daily Progression

Each day the targets increase by:

| Exercise | Daily Increase |
| -------- | -------------- |
| Push-ups | +1 rep         |
| Sit-ups  | +1 rep         |
| Plank    | +5 seconds     |

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

1. _"You had ONE job. ONE. And you blew it. Welcome back to Day 1, quitter."_
2. _"Wow. Even your streak couldn't stand you. Starting over like the amateur you are."_
3. _"Classic. The arc waits for no one — especially not you. Day 1. Again."_
4. _"Your future self is embarrassed. Day 1. Try not to mess it up this time."_
5. _"The cold doesn't take days off. Unfortunately, you do. Back to the beginning."_
6. _"A whole streak, wasted. Absolutely shameful. Day 1 is calling your name."_
7. _"Did life get 'too busy'? The push-up doesn't care. Neither does this app. Reset."_
8. _"You broke the arc. The arc is disappointed. Back to square one, champ."_

A "Continue" button dismisses the Shame Screen and loads the Day 1 workout.

---

## App Screens & Flow

### 1. Home / Day View (primary screen)

- Displayed on app open
- Has day navigation controls to move between dates (past and today only)
- Shows all activities due for the selected date as **interactive activity buttons/cards**
- Each activity card contains:
  - activity name
  - target value + unit (e.g., `12 reps`, `30 sec`, `5 km`)
  - completion state (`pending`, `in-progress` for timer, `done`)
- Activity completion is saved immediately per activity/date in IndexedDB

### 1a. Plank / Timer Activity Behavior

- Clicking a timer-type activity (for now plank) starts a countdown
- Timer auto-completes activity at `00:00`
- While active, card shows running state and remaining time
- Prevent duplicate starts while timer is already running

### 1b. Daily Completion Behavior

- There is no single mandatory "Done for Today" action for progress safety
- A date is considered completed when **all due activities for that date** are completed
- If user forgot to confirm earlier, they can navigate back to that date and complete the missing activities

### 2. Freeze Screen (shown when exactly one missed due date is detected)

- Informs user a streak break is pending
- Shows a **Use Freeze** path if user owns a freeze
- Shows a **Backfill Missed Date** path so user can complete missing due activities and preserve streak
- Shows a secondary reset path that triggers Shame Screen

### 3. Completion Screen

- Congratulates user for completing the selected date
- Displays:
  - **Current streak**
  - **Best streak**
  - **Freeze inventory** (`0` or `1`)
  - **Total completed dates/workouts**
  - **Lifetime totals** for tracked activities

### 4. Activity Settings Screen

- Manage custom activities (add, edit, archive)
- Each activity has:
  - `name`
  - `startValue`
  - `increase`
  - `period`
  - `periodUnit` (`day` or `week`)
  - `unitLabel` (e.g., reps, sec, km)
  - `effectiveStartDate`

### 5. Shame Screen (shown when streak is broken with no freeze/backfill)

- Full-screen dark overlay with red tint
- Displays one of the bully messages (randomly selected)
- Shows the user's now-dead streak number: _"You had a X-day streak. Had."_
- A "Continue" button that starts the new streak cycle

---

## Data Storage — IndexedDB

All data is stored locally using the browser's **IndexedDB** API. No backend or server required.

### Object Store: `workouts`

Each completed workout session is stored as a record:

| Field         | Type   | Description                                                 |
| ------------- | ------ | ----------------------------------------------------------- |
| `date`        | string | ISO date string (e.g. `"2026-03-09"`) — used as primary key |
| `day`         | number | Program day number (1, 2, 3, …)                             |
| `pushups`     | number | Number of push-ups completed                                |
| `situps`      | number | Number of sit-ups completed                                 |
| `plankSecs`   | number | Plank duration in seconds                                   |
| `completedAt` | string | ISO timestamp of completion                                 |

### Object Store: `streaks`

Tracks the current active streak session:

| Field             | Type   | Description                                 |
| ----------------- | ------ | ------------------------------------------- |
| `id`              | number | Always `1` — single record                  |
| `startDate`       | string | ISO date when current streak began          |
| `currentStreak`   | number | Number of days in the current active streak |
| `bestStreak`      | number | Highest streak ever reached                 |
| `freezesUsed`     | number | Total number of streak freezes ever used    |
| `freezeInventory` | number | Current available freezes (`0` or `1`)      |

### Object Store: `activities`

Stores activity schedule definitions:

| Field                | Type    | Description                                           |
| -------------------- | ------- | ----------------------------------------------------- |
| `id`                 | string  | Unique activity ID                                    |
| `name`               | string  | Display name                                          |
| `startValue`         | number  | Base target value                                     |
| `increase`           | number  | Increment each period (`0` means constant)            |
| `period`             | number  | Period amount (e.g. `1`, `2`)                         |
| `periodUnit`         | string  | `day` or `week`                                       |
| `unitLabel`          | string  | Unit display (`reps`, `sec`, `km`, etc.)              |
| `effectiveStartDate` | string  | Date this activity starts affecting target generation |
| `archivedAt`         | string? | Optional archive date (null when active)              |

### Object Store: `activityCompletions`

Per-date activity completion records:

| Field         | Type    | Description                            |
| ------------- | ------- | -------------------------------------- |
| `id`          | string  | Composite key: `${date}:${activityId}` |
| `date`        | string  | ISO date                               |
| `activityId`  | string  | Linked activity ID                     |
| `targetValue` | number  | Computed target value for that date    |
| `completed`   | boolean | Completion state                       |
| `completedAt` | string? | Completion timestamp                   |

### Derived Statistics (computed from stored records)

- **Current streak**: from the `streaks` store `currentStreak` field
- **Total completed dates**: number of dates where all due activities are completed
- **Lifetime totals**: aggregate by activity and unit from `activityCompletions`
- **Best streak**: `bestStreak` from the `streaks` store
- **Freeze inventory**: `freezeInventory` (`max = 1`)
- **Missed date detection**: evaluate due activities by date; if any due activity missing on a past due date, streak is at risk
- **Global streak rule**: streak is global. If one due activity fails for a date, streak fails for that date

---

## PWA Requirements

- `manifest.json` with app name, icons, theme color, and `display: standalone`
- Service Worker with offline caching (cache-first strategy for static assets)
- Installable on Android, iOS, and desktop Chrome/Edge
- App icon: custom SVG (source at `public/icon.svg`) + PNG exports at 192×192 and 512×512
- Icon design: deep navy rounded-square background, bold icy arc gradient (dark blue → ice blue → white → ice blue → dark blue), snowflake motif center, star/snow particle accents

### Notifications & Badge

- The app must request notification permission from the user
- The app must support **both badge and push/local notifications**
- Daily reminder time is fixed to **20:00 local device time**
- Reminder content example: "Winter Arc check-in. Complete today's activities."
- Badge behavior:
  - Set app badge when today's due activities are still incomplete after reminder time
  - Clear badge once all today's due activities are completed
- If platform supports reliable background scheduling, notification is delivered at 20:00
- If platform does not support reliable background scheduling while app is closed, fallback is:
  - show reminder immediately on next app open after 20:00
  - keep badge state accurate regardless

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
- Custom exercise targets

---

## Tech Stack

| Concern    | Choice                              |
| ---------- | ----------------------------------- |
| Framework  | React + Vite                        |
| Styling    | CSS Modules or Tailwind             |
| Storage    | IndexedDB (via `idb` lib)           |
| PWA        | Vite PWA plugin (`vite-plugin-pwa`) |
| Deployment | GitHub Pages                        |
