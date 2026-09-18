# MealMate 🍲
**Offline Food Expense & Attendance Tracker**

MealMate is a 100% offline, privacy-first mobile application built for PG (Paying Guest) and Mess environments. It replaces manual WhatsApp logs and Excel spreadsheets by allowing you to track daily meal attendance, manage dynamic pricing, and generate monthly financial reports—all directly on your device with zero cloud dependency.

---

## 🚀 Features

* **100% Offline & Private:** No backend, no login, no cloud sync. All data is securely stored locally using SQLite.
* **Daily Attendance Tracking:** Easily mark Morning, Afternoon, and Night meals for all active members.
* **Dynamic Pricing Engine:** Meal prices are versioned by `effective_from` dates. Changing the price mid-month will only affect future calculations, preserving accurate historical records.
* **Comprehensive Monthly Summaries:** Instantly view per-member meal counts, total costs, and the grand total for any given month.
* **Professional Exports:**
  * **PDF:** Deterministic A4 pagination with clean, offline-branded layout (Light Mode forced for print).
  * **Excel (XLSX):** Spreadsheet exports separating Member Summaries and Daily Breakdowns into distinct sheets.
* **Cross-Platform Compatibility:** Runs natively on Android/iOS and supports Expo Web (utilizing OPFS for local database storage).
* **Modern UI:** Clean interface with full Light/Dark mode support using dynamic theming.

---

## 🛠 Tech Stack

* **Framework:** React Native / Expo (Managed Workflow)
* **Navigation:** Expo Router (File-based navigation)
* **Local Database:** `expo-sqlite` (Relational, robust, and offline)
* **Exporting:** `expo-print` (PDF), `expo-file-system`, `expo-sharing`, and `xlsx`
* **Dates:** `date-fns`

---

## ⚙️ Project Setup & Installation

### Prerequisites
* Node.js (v18+)
* npm or yarn
* [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NAVEENKUMAR-T-GIT-28/MealMate.git
   cd mealmate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```
   *Press `w` to open in a web browser, or scan the QR code with the Expo Go app to preview on your phone.*

---

## 📦 Building the APK (Production)

MealMate is configured for EAS (Expo Application Services). To build a standalone Android APK:

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Trigger the Android APK build:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   *EAS will compile the project and provide a direct link to download the `.apk` file.*

---

## 🏗️ Architecture Notes

* **Data Ownership:** Since the app is 100% local, device loss means data loss. In future iterations, the export features can be extended to import/backup raw JSON blobs.
* **Web Limitations:** When running on Expo Web, `expo-sqlite` utilizes the Origin Private File System (OPFS). Be aware that hot-reloading the browser tab may temporarily lock the OPFS state. If you encounter an `Invalid VFS state` error on the web, close the tab, restart the `expo start -c` server, and reopen the browser.

---

## 📄 License
Released under the [MIT License](LICENSE).