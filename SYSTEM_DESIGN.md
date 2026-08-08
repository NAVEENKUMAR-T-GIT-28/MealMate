# MealMate - Technical Codebase & System Design Report

## 1. Project Overview
The MealMate is a 100% offline-first, mobile-optimized React Native application built with the Expo framework. It is designed to track daily meal attendance and calculate associated food expenses for members in a PG (Paying Guest) or hostel environment. 

The application architecture strictly adheres to a local-first philosophy, ensuring data privacy and offline usability.

## 2. Technology Stack
- **Framework**: React Native + Expo (SDK 57)
- **Language**: TypeScript (Strict mode enabled)
- **Navigation**: Expo Router (File-based routing v4+)
- **Storage/Database**: SQLite (`expo-sqlite`)
- **Animations**: React Native Reanimated (`react-native-reanimated`)
- **Icons**: Expo Vector Icons (`@expo/vector-icons` - Ionicons)
- **Data Export**: `expo-print` (PDF), `xlsx` (Excel), `expo-file-system/legacy` & `expo-sharing`
- **Date Handling**: `date-fns`

## 3. System Architecture

The codebase follows a modular, feature-separated architecture organized into a standard Expo Router directory structure.

### 3.1 Directory Structure
```
src/
├── app/                  # Expo Router file-based routes (UI Layer)
│   ├── _layout.tsx       # Root layout & ThemeProvider setup
│   ├── index.tsx         # Today's attendance screen
│   ├── members.tsx       # Member management screen
│   ├── summary/          # Monthly summary and individual details routes
│   ├── history.tsx       # Historical data view
│   └── settings.tsx      # App configuration and data export
├── components/           # Reusable UI components
│   ├── MealToggle.tsx    # Interactive toggle button for meals
│   ├── MemberRow.tsx     # Reusable row displaying member & meal toggles
│   └── SummaryTable.tsx  # Data visualization for expenses
├── db/                   # Data Access Layer (SQLite)
│   ├── database.ts       # Connection pooling & Schema initialization
│   ├── entries.repo.ts   # CRUD for meal entries
│   ├── memberMonthlyDetails.service.ts # Core logic for calculating member attendance & pricing
│   ├── members.repo.ts   # CRUD for members
│   ├── prices.repo.ts    # Price management logic
│   └── summary.repo.ts   # Complex aggregation queries
└── utils/                # Utilities & Context Providers
    ├── ThemeProvider.tsx # Global UI state for Light/Dark themes
    ├── theme.ts          # Color palettes and hooks
    ├── dateHelpers.ts    # Date manipulation functions
    ├── exportPdf.ts      # HTML & PDF generation logic via expo-print
    └── exportExcel.ts    # XLSX spreadsheet generation via xlsx
```

## 4. Data Layer & Schema Design

The app utilizes a relational schema within a local SQLite database (`pg_food_tracker.db`). The database connection is preserved across Hot Module Reloads (HMR) during development. The DB operates in WAL (Write-Ahead Logging) mode for improved concurrent performance.

### 4.1 Database Schema (SQLite)

- **`members`**: Stores individual records.
  - `id` (PK), `name` (TEXT), `is_active` (INTEGER boolean), `created_at` (TEXT)
- **`meal_entries`**: Tracks daily attendance per member per meal.
  - `id` (PK), `member_id` (FK), `date` (TEXT), `meal_type` (TEXT check), `ate` (INTEGER boolean).
  - *Unique Constraint*: `(member_id, date, meal_type)` prevents duplicate records.
- **`meal_prices`**: Historical tracking of meal costs.
  - `id` (PK), `meal_type` (TEXT check), `price` (REAL), `effective_from` (TEXT).


### 4.2 Data Access Pattern (Repository Pattern)
The application separates UI from data logic using the Repository Pattern. Files in `src/db/` export async functions that execute SQLite queries (`runAsync`, `getAllAsync`, `getFirstAsync`). This ensures components remain focused on presentation while database transactions are localized.

## 5. User Interface & State Management

### 5.1 Dynamic Theming System
The app features a robust dynamic theming engine supporting Light, Dark, and System modes.
- **State Storage**: User preference is stored via `expo-file-system/legacy` (or `window.localStorage` on Web) in a `theme_settings.json` file.
- **Context API**: `src/utils/ThemeProvider.tsx` provides the globally resolved color palette.
- **Reactive Styling**: Components consume `useAppTheme()` and regenerate React Native `StyleSheet` instances dynamically using `useMemo` when the theme toggles.

### 5.2 Navigation Strategy
Expo Router is utilized to maintain deep-linkable, predictable navigation paths:
- The app uses a global bottom `<Tabs>` layout.
- The `summary` stack contains nested parameters (`/summary/member/[memberId]/[month]`) to drill down into specific data securely, while hiding the bottom tab bar on child screens for a cleaner UI focus.

## 6. Key Features & Business Logic

1. **Daily Attendance Marking (`index.tsx`)**: Utilizes `react-native-reanimated` to spring-animate meal toggles. Toggling instantly writes to the `meal_entries` table.
2. **Member Lifecycle (`members.tsx`)**: Full CRUD support for members, including renaming (UI modal) and cascading deletion of associated historical data.
3. **Complex Aggregation (`summary.repo.ts`)**: Calculates the dynamic monthly bill for each member by querying `meal_entries` and multiplying by the *effective* `meal_prices` active during that specific period.
4. **Offline Data Portability (`settings.tsx`)**: Generates complete offline exports including deterministically paginated PDF Reports via `expo-print` and fully formatted Excel sheets via `xlsx`.

## 7. Configuration & Environment
- **Expo Router SDK 57 Compatibility**: To align with Expo Router v4+, `react-navigation` dependencies were explicitly removed from `package.json`, and dynamic header/tab styling was delegated exclusively to Expo Router's native `screenOptions` to avoid context conflicts.
- **Web Support fallback**: The file system API gracefully degrades to `window.localStorage` during web testing (`Platform.OS === 'web'`).
