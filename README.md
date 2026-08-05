# Food Expense Tracker — Offline Mobile App

System design and implementation plan for converting the Excel/Google Sheets
Version 1 prototype into a fully offline Expo React Native app.

---

## 1. Goal

Replace the WhatsApp/Excel manual tracking of PG mess attendance with an
offline mobile app that:

- Lets members mark which meals (Morning / Afternoon / Night) they ate, per day.
- Automatically calculates who owes how much, based on configurable meal prices.
- Supports members joining/leaving anytime.
- Works with **zero internet, zero backend, zero login** — everything lives
  on the device.
- Keeps full multi-month history so past months can be reviewed anytime.

---

## 2. Core Principles

| Principle | Decision |
|---|---|
| Connectivity | 100% offline, no network calls anywhere in the app |
| Backend | None — no Firebase, no REST API, no cloud sync |
| Auth | None — single-device, single-household use |
| Storage | SQLite (via `expo-sqlite`) — relational, durable, query-friendly |
| Platform | Expo (managed workflow) — fastest path to Android/iOS builds |
| Data ownership | User can export/import a backup file manually (see §8) |

---

## 3. Tech Stack

- **Framework:** Expo (React Native, managed workflow)
- **Navigation:** `expo-router` or `@react-navigation/native` (bottom tabs + stack)
- **Local DB:** `expo-sqlite` (structured, supports SUM/COUNT queries like Excel formulas)
- **State/data layer:** Simple repository functions wrapping SQL queries (no Redux needed — app is small)
- **Styling:** `NativeWind` (Tailwind for RN) or plain `StyleSheet` — either works; NativeWind speeds up iteration
- **Date handling:** `date-fns`
- **Export:** `expo-file-system` + `expo-sharing` (export month as CSV/PDF)

No Firebase, no Supabase, no auth libraries, no push notifications.

---

## 4. Data Model (SQLite Schema)

This mirrors the Excel structure 1:1 — members, daily meal marks, and a
settings table for prices.

```sql
-- Members can be added/removed anytime. "removed" members are soft-deleted
-- so historical months still show their name correctly.
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,   -- 0 = removed, hidden from "add new day" screen
  created_at TEXT NOT NULL
);

-- One row per (member, date, meal). This is the equivalent of a single
-- checkbox cell in the Excel sheet.
CREATE TABLE meal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  date TEXT NOT NULL,             -- 'YYYY-MM-DD'
  meal_type TEXT NOT NULL CHECK (meal_type IN ('morning','afternoon','night')),
  ate INTEGER NOT NULL DEFAULT 0, -- 1 = ate this meal, 0 = skipped/home
  UNIQUE(member_id, date, meal_type)
);

-- Meal prices are versioned by effective date, so a mid-month price change
-- doesn't retroactively alter past days (unlike a single static Excel cell).
CREATE TABLE meal_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('morning','afternoon','night')),
  price REAL NOT NULL,
  effective_from TEXT NOT NULL   -- 'YYYY-MM-DD'
);

-- Optional: track manual payments/settlements per member per month
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  month TEXT NOT NULL,           -- 'YYYY-MM'
  amount_paid REAL NOT NULL DEFAULT 0,
  note TEXT
);
```

**Why versioned prices instead of one settings row?**
Your WhatsApp log shows the same three prices the whole time, but if the
mess ever raises the morning rate mid-month, a single overwritten "settings"
value (like the Excel cell) would silently recalculate *past* days at the
new price. Versioning by `effective_from` avoids that — it's the one
deliberate upgrade over the spreadsheet's behavior.

---

## 5. Business Logic (mirrors your Excel formulas)

| Excel concept | SQLite/JS equivalent |
|---|---|
| Checkbox per member per meal | Row in `meal_entries`, `ate = 1` |
| `N13:N15` price cells | `meal_prices` table, latest row where `effective_from <= date` |
| `COUNTIFS` per meal per day | `SELECT COUNT(*) FROM meal_entries WHERE date=? AND meal_type=? AND ate=1` |
| Day total (people × price, summed per meal) | `SUM(count_per_meal * price_for_that_meal)` across 3 meals |
| Per-person monthly SUM | `SELECT meal_type, COUNT(*) FROM meal_entries WHERE member_id=? AND date BETWEEN ? AND ? AND ate=1 GROUP BY meal_type`, then multiply by matching price and sum |
| Grand Total | `SUM` of all members' monthly totals for that month |

All of this is computed on-the-fly from raw entries — no stored running
totals — so edits to a past day (e.g. "oops, forgot to mark Tuesday") always
recompute correctly, same as an Excel formula would.

---

## 6. App Structure (Screens)

```
App
├── Today / Day Entry Screen
│     - Date picker (defaults to today)
│     - List of active members
│     - 3 toggles per member: Morning / Afternoon / Night
│     - Auto-shows day total live as you mark
│
├── Members Screen
│     - Add member (name)
│     - Remove/deactivate member (keeps history intact)
│
├── Settings Screen
│     - Morning / Afternoon / Night price fields
│     - Saving creates a new `meal_prices` row effective from today
│
├── Monthly Summary Screen
│     - Month picker
│     - Table: Member | Meals eaten (M/A/N counts) | Amount owed
│     - Grand total for the month
│     - Optional: mark payments received per member
│
└── History Screen
      - List of past months
      - Tap a month → opens Monthly Summary for that month (read-only view)
```

---

## 7. Folder Structure (Expo project)

```
pg-food-tracker/
├── app/                      # expo-router screens
│   ├── index.tsx              # Today / Day Entry
│   ├── members.tsx
│   ├── settings.tsx
│   ├── summary/[month].tsx
│   └── history.tsx
├── db/
│   ├── schema.ts               # CREATE TABLE statements, run on first launch
│   ├── migrations.ts           # simple version-based migrations
│   ├── members.repo.ts         # add/remove/list members
│   ├── entries.repo.ts         # mark/unmark meal, get entries by date
│   ├── prices.repo.ts          # get/set meal prices
│   └── summary.repo.ts         # monthly aggregation queries
├── components/
│   ├── MemberRow.tsx
│   ├── MealToggle.tsx
│   └── SummaryTable.tsx
├── utils/
│   └── dateHelpers.ts
├── app.json
└── package.json
```

---

## 8. Backup / Export (since there's no cloud sync)

Because everything is local-only, device loss = data loss unless there's a
manual export path:

- **Export:** button in Settings → dumps SQLite data to a `.json` or `.csv`
  file → shared via `expo-sharing` (WhatsApp, email, Drive — user's choice,
  app itself stays offline).
- **Import:** pick a previously exported file → restores into SQLite.
- This is optional for v1 but strongly recommended before real usage,
  since PG members change phones often.

---

## 9. Matching Your Real Usage Pattern

Your WhatsApp log format —
`Wednesday - full day`, `Friday - morn(5), afternoon(3), night(5)` — maps
directly to marking toggles per member per meal; the app derives the
per-meal headcount automatically instead of you typing it manually. "Full
day" = all three toggles on for every active member that day.

---

## 10. Build Plan (Milestones)

1. **Scaffold** — Expo app, navigation shell, SQLite init + schema.
2. **Members CRUD** — add/remove members, active/inactive flag.
3. **Day Entry screen** — toggle meals per member per date, live day total.
4. **Settings screen** — editable meal prices (versioned).
5. **Monthly Summary** — per-member totals + grand total, matches Excel logic.
6. **History** — browse past months.
7. **Export/Import** — JSON/CSV backup via share sheet.
8. **Polish** — empty states, month-end reminders (local notification only), UI pass.

---

## 11. What's Explicitly Out of Scope

- No login/signup, no multi-device sync, no cloud backend.
- No push notifications requiring a server.
- No payment gateway — "payments" table is just a manual "paid ₹X" note for
  settling up, not real money movement.

---

*This document is the shared source of truth for the project. Future
requests build on this schema and screen structure unless explicitly
changed.*