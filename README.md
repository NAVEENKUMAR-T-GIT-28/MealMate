# MealMate v2 — Initial Build Spec (React + Node/Express + SQL)

Web-based first build. Multi-user, group-based, cloud-synced meal tracker.
Stack: **React.js** (frontend) + **Node.js/Express.js** (backend API) + **SQL (PostgreSQL/MySQL)** (DB) + **JWT auth**.

---

## 1. Architecture Overview

```
┌───────────────────────┐        HTTPS/JSON        ┌───────────────────────────┐
│   React.js Frontend    │ ───────────────────────▶ │   Express.js REST API      │
│                        │ ◀─────────────────────── │                            │
│  - Auth pages          │      JWT in header        │  - Auth routes             │
│  - Group create/join   │                            │  - Group routes            │
│  - Attendance calendar │                            │  - Attendance routes       │
│  - Admin price panel   │                            │  - Price routes            │
│  - Monthly summary     │                            │  - Summary routes          │
└───────────────────────┘                            └─────────────┬─────────────┘
                                                                    │ SQL (pg / mysql2)
                                                                    ▼
                                                       ┌───────────────────────────┐
                                                       │   PostgreSQL / MySQL DB     │
                                                       │  users, groups, members,    │
                                                       │  attendance, meal_prices    │
                                                       └───────────────────────────┘
```

- **Auth:** JWT-based. On login, server issues a signed token containing `user_id`. Frontend stores it (httpOnly cookie preferred, or localStorage for v1 simplicity) and sends it on every request.
- **Authorization:** Middleware checks `req.user.id` against `group_members` to confirm group access, and against `attendance.user_id` to confirm record ownership.
- **DB:** PostgreSQL recommended (better date/numeric handling), but schema below works on MySQL with minor type tweaks (noted).

---

## 2. Database Schema (SQL)

```sql
-- ========== USERS ==========
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== GROUPS ==========
CREATE TABLE groups (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  invite_code  VARCHAR(10) NOT NULL UNIQUE,
  created_by   INTEGER NOT NULL REFERENCES users(id),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== GROUP MEMBERS ==========
CREATE TABLE group_members (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- ========== MEAL PRICES (versioned by date) ==========
CREATE TABLE meal_prices (
  id             SERIAL PRIMARY KEY,
  group_id       INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  meal_type      VARCHAR(10) NOT NULL CHECK (meal_type IN ('morning','afternoon','night')),
  price          NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  created_by     INTEGER NOT NULL REFERENCES users(id),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== ATTENDANCE (one row per user per day) ==========
CREATE TABLE attendance (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  morning     BOOLEAN NOT NULL DEFAULT FALSE,
  afternoon   BOOLEAN NOT NULL DEFAULT FALSE,
  night       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id, date)
);

CREATE INDEX idx_attendance_group_month ON attendance (group_id, date);
```

> MySQL notes: replace `SERIAL` → `INT AUTO_INCREMENT`, `NUMERIC` → `DECIMAL`, `BOOLEAN` → `TINYINT(1)`.

---

## 3. API Endpoints (Express)

Base URL: `/api`. All routes except `/auth/*` require header `Authorization: Bearer <JWT>`.

### Auth
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/auth/signup` | `{ full_name, email, password }` | Creates user, hashes password (bcrypt), returns JWT |
| POST | `/auth/login` | `{ email, password }` | Verifies password, returns JWT |
| GET  | `/auth/me` | — | Returns current user profile (from token) |

### Groups
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/groups` | `{ name }` | Creates group, generates unique invite code, adds creator as `admin` |
| POST | `/groups/join` | `{ invite_code }` | Adds current user to group as `member` |
| GET  | `/groups/mine` | — | Lists groups the current user belongs to |
| GET  | `/groups/:id` | — | Group details + member list (must be a member) |
| POST | `/groups/:id/regenerate-code` | — | Admin-only: rotates invite code |

### Meal Prices
| Method | Route | Body | Description |
|---|---|---|---|
| GET  | `/groups/:id/prices` | — | List price history for the group (any member) |
| POST | `/groups/:id/prices` | `{ meal_type, price, effective_from }` | Admin-only: add a new price version |

### Attendance
| Method | Route | Body | Description |
|---|---|---|---|
| GET  | `/groups/:id/attendance?month=YYYY-MM` | — | Get all members' attendance for the month (any member can read) |
| GET  | `/groups/:id/attendance/me?month=YYYY-MM` | — | Get current user's own attendance for the month |
| PUT  | `/groups/:id/attendance/:date` | `{ morning, afternoon, night }` | Upsert **own** attendance for that date only — server checks `req.user.id` before writing |

### Summary
| Method | Route | Description |
|---|---|---|
| GET | `/groups/:id/summary?month=YYYY-MM` | Per-member meal counts + cost, computed server-side using price versioning logic (any member can view) |

---

## 4. Backend Authorization Logic

No database-level RLS in this stack, so **every route enforces ownership/role checks in middleware**:

```js
// middleware/requireGroupMember.js
async function requireGroupMember(req, res, next) {
  const { id: groupId } = req.params;
  const membership = await db.query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, req.user.id]
  );
  if (membership.rows.length === 0) return res.status(403).json({ error: 'Not a group member' });
  req.membership = membership.rows[0];
  next();
}

// middleware/requireGroupAdmin.js
function requireGroupAdmin(req, res, next) {
  if (req.membership.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}
```

```js
// PUT /groups/:id/attendance/:date — the key ownership rule
router.put('/groups/:id/attendance/:date', auth, requireGroupMember, async (req, res) => {
  const { id: groupId, date } = req.params;
  const { morning, afternoon, night } = req.body;
  await db.query(`
    INSERT INTO attendance (group_id, user_id, date, morning, afternoon, night, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (group_id, user_id, date)
    DO UPDATE SET morning=$4, afternoon=$5, night=$6, updated_at=NOW()
  `, [groupId, req.user.id, date, morning, afternoon, night]);
  res.json({ success: true });
});
```

Note: `req.user.id` (from the JWT) is always used as the `user_id` — never trust a `user_id` passed in the request body. This is what stops a user from writing another member's attendance.

---

## 5. Invite Code Generation

```js
function generateInviteCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O, 1/I
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function createGroupWithUniqueCode(name, userId) {
  let code, exists = true;
  while (exists) {
    code = generateInviteCode();
    const check = await db.query('SELECT 1 FROM groups WHERE invite_code = $1', [code]);
    exists = check.rows.length > 0;
  }
  const group = await db.query(
    'INSERT INTO groups (name, invite_code, created_by) VALUES ($1,$2,$3) RETURNING *',
    [name, code, userId]
  );
  await db.query(
    'INSERT INTO group_members (group_id, user_id, role) VALUES ($1,$2,$3)',
    [group.rows[0].id, userId, 'admin']
  );
  return group.rows[0];
}
```

---

## 6. Monthly Summary Query (price-versioning logic)

```sql
SELECT
  a.user_id,
  u.full_name,
  COUNT(*) FILTER (WHERE a.morning) AS morning_count,
  COUNT(*) FILTER (WHERE a.afternoon) AS afternoon_count,
  COUNT(*) FILTER (WHERE a.night) AS night_count,
  SUM(
    (CASE WHEN a.morning THEN COALESCE(mp_m.price,0) ELSE 0 END) +
    (CASE WHEN a.afternoon THEN COALESCE(mp_a.price,0) ELSE 0 END) +
    (CASE WHEN a.night THEN COALESCE(mp_n.price,0) ELSE 0 END)
  ) AS total_cost
FROM attendance a
JOIN users u ON u.id = a.user_id
LEFT JOIN LATERAL (
  SELECT price FROM meal_prices
  WHERE group_id = a.group_id AND meal_type = 'morning' AND effective_from <= a.date
  ORDER BY effective_from DESC LIMIT 1
) mp_m ON true
LEFT JOIN LATERAL (
  SELECT price FROM meal_prices
  WHERE group_id = a.group_id AND meal_type = 'afternoon' AND effective_from <= a.date
  ORDER BY effective_from DESC LIMIT 1
) mp_a ON true
LEFT JOIN LATERAL (
  SELECT price FROM meal_prices
  WHERE group_id = a.group_id AND meal_type = 'night' AND effective_from <= a.date
  ORDER BY effective_from DESC LIMIT 1
) mp_n ON true
WHERE a.group_id = $1
  AND date_trunc('month', a.date) = date_trunc('month', $2::date)
GROUP BY a.user_id, u.full_name;
```

---

## 7. Backend Folder Structure (Node/Express)

```
server/
├── src/
│   ├── config/
│   │   └── db.js                 # pg Pool setup
│   ├── middleware/
│   │   ├── auth.js                # verifies JWT, sets req.user
│   │   ├── requireGroupMember.js
│   │   └── requireGroupAdmin.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── groups.routes.js
│   │   ├── prices.routes.js
│   │   ├── attendance.routes.js
│   │   └── summary.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── groups.controller.js
│   │   ├── prices.controller.js
│   │   ├── attendance.controller.js
│   │   └── summary.controller.js
│   ├── utils/
│   │   └── inviteCode.js
│   ├── app.js                     # express app + route mounting
│   └── server.js                  # entry point, listens on PORT
├── migrations/                    # SQL schema files (numbered)
├── .env                           # DB_URL, JWT_SECRET, PORT
└── package.json
```

Key packages: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`, `express-validator`.

---

## 8. Frontend Structure (React.js)

```
client/
├── src/
│   ├── api/
│   │   ├── axiosClient.js         # base axios instance, attaches JWT header
│   │   ├── auth.js
│   │   ├── groups.js
│   │   ├── attendance.js
│   │   ├── prices.js
│   │   └── summary.js
│   ├── context/
│   │   ├── AuthContext.jsx        # holds user + token, login/logout/signup
│   │   └── GroupContext.jsx       # holds current active group + membership role
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── GroupGatePage.jsx      # "Create a Group" / "Join a Group" choice
│   │   ├── DashboardPage.jsx      # today's attendance + quick stats
│   │   ├── AttendanceCalendarPage.jsx
│   │   ├── AdminPricesPage.jsx    # admin-only: set/version meal prices
│   │   ├── MonthlySummaryPage.jsx # table + export buttons
│   │   └── GroupSettingsPage.jsx  # invite code display/regen, member list
│   ├── components/
│   │   ├── MealToggle.jsx         # morning/afternoon/night switches for a day
│   │   ├── GroupSwitcher.jsx      # dropdown if user is in multiple groups
│   │   ├── ProtectedRoute.jsx     # redirects to /login if no token
│   │   └── SummaryTable.jsx
│   ├── App.jsx                    # React Router routes
│   └── main.jsx
└── package.json
```

### Frontend logic flow
1. **App load:** `AuthContext` checks stored JWT → calls `/auth/me` → sets user or redirects to `/login`.
2. **Post-login:** `GroupContext` calls `/groups/mine`.
   - 0 groups → route to `GroupGatePage` (create/join).
   - 1+ groups → set first (or last-used) as `currentGroup`, route to `DashboardPage`.
3. **Attendance marking:** `AttendanceCalendarPage` fetches `/groups/:id/attendance/me?month=X`, renders a calendar; each day's `MealToggle` PUTs to `/groups/:id/attendance/:date` on change (optimistic UI update, roll back on error).
4. **Admin views:** `AdminPricesPage` and member management only rendered if `GroupContext.membership.role === 'admin'` (mirrors backend enforcement — UI hides it, backend actually blocks it).
5. **Summary/export:** `MonthlySummaryPage` fetches `/groups/:id/summary?month=X`, renders `SummaryTable`; "Export PDF/Excel" buttons generate client-side from that same JSON (reuse existing export logic from v1, just swap the data source).

### Routing (`react-router-dom`)
```
/login
/signup
/groups            (gate: create/join)
/dashboard         (protected, needs currentGroup)
/attendance
/summary
/admin/prices      (admin only)
/settings          (invite code, members)
```

---

## 9. Environment Variables

**Backend (`server/.env`)**
```
PORT=4000
DATABASE_URL=postgres://user:pass@localhost:5432/mealmate
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
```

**Frontend (`client/.env`)**
```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 10. Build Order

1. Set up Postgres DB, run schema SQL from §2.
2. Scaffold Express server; implement `/auth/signup`, `/auth/login`, `/auth/me` + JWT middleware.
3. Implement `/groups` create/join + invite code util (§5).
4. Implement `requireGroupMember` / `requireGroupAdmin` middleware.
5. Implement attendance routes (own-record enforcement is the critical piece — test that user A cannot write user B's row).
6. Implement meal price routes (admin-only writes).
7. Implement summary route (§6 query).
8. Scaffold React app: routing, AuthContext, GroupContext, axios client with JWT interceptor.
9. Build Login/Signup pages.
10. Build Group Gate (create/join) page.
11. Build Attendance Calendar page + MealToggle component.
12. Build Admin Prices page.
13. Build Monthly Summary page + wire existing PDF/XLSX export logic to new API data.
14. Test multi-user flow end-to-end: two accounts, one group, verify isolation of attendance writes.