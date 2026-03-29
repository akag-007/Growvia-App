# 🚀 Growvia

> A gamified productivity system that helps you track not just tasks — but real progress.

---

## 🧠 Overview

Growvia is a **cross-platform productivity OS** designed for students, professionals, and high-performance individuals who want to:

* Plan their work
* Track actual time spent
* Build long-term projects
* Maintain consistency
* Visualize growth

Unlike traditional to-do apps, Growvia focuses on **time, discipline, and measurable progress**.

---

## ✨ Core Features

### 🔹 1. Authentication & User System

* Email + password authentication
* Secure session handling (Supabase Auth)
* Cross-device sync
* Optional Google integration (calendar sync)
* Account deletion → full data wipe

---

### 🔹 2. Daily Task System

A powerful task management system with prioritization and visualization.

#### Features:

* Create tasks with:

  * Title & description
  * Category
  * Planned duration
  * Due date & time
  * Priority (Eisenhower Matrix)
* Edit / delete tasks
* Push tasks to another day
* Category-based filtering

#### Views:

* **List View** → Task cards with all details
* **Matrix View** → Tasks organized in Eisenhower Matrix:

  * Urgent & Important
  * Not Urgent but Important
  * Urgent but Not Important
  * Neither

#### Task Card Includes:

* Title
* Category
* Planned duration
* Due time/date
* Progress (time tracked)
* Linked project (if any)

---

### 🔹 3. Timer Engine (Core System)

Tracks real effort, not just intentions.

#### Features:

* Built-in task timer
* Start / pause / stop
* Multiple sessions per task
* Partial session tracking
* Total accumulated time

#### System Design:

* Append-only session logs
* No overwriting of time
* Works offline and syncs later

---

### 🔹 4. Long Tasks / Projects

Track multi-day goals and projects.

#### Features:

* Create long-term tasks with:

  * Title
  * Description
  * Deadline
  * Estimated duration
* Link daily tasks to long tasks
* View all linked tasks

#### Progress Logic:

* Aggregated from all linked task sessions
* Circular progress visualization
* Time spent vs estimated duration

---

### 🔹 5. Task ↔ Project Linking

Bridge between daily execution and long-term goals.

* Link/unlink tasks to projects
* Many-to-many relationships supported
* Real-time progress aggregation

---

### 🔹 6. Gamification Engine

Keeps users consistent and motivated.

#### Metrics:

**Daily Score**

* Based on:

  * Time spent
  * Tasks completed
  * Planning accuracy
  * Consistency

**Streak**

* Maintained if score > threshold (default: 55)

**Weekly Momentum**

* Graph showing performance trends

---

### 🔹 7. Revisits (Spaced Repetition)

Built for learning and retention.

#### Features:

* Add revisit items:

  * Title
  * Link (optional)
  * Category
  * Scheduled revisit date
  * Estimated time
* Predefined or custom intervals

#### Tracking:

* Completion count
* Full revisit history

#### Export:

* CSV / Excel download

---

### 🔹 8. Calendar System

Time-based visualization of work.

* View tasks and revisits by date
* Move tasks across days
* Sync to Google Calendar (one-way)

---

### 🔹 9. Notes System

Lightweight note-taking.

* Create and manage notes
* Expandable for future features

---

### 🔹 10. Custom Challenges

Habit-building system.

#### Features:

* Create custom challenges:

  * Name
  * Duration
  * Check-in type (daily / weekly / hourly)
* Grid-based tracking UI
* Checkbox completion system

Examples:

* 75 Hard
* 100 Days of Code

---

## 🖥️ Application Pages

### 📊 Dashboard (Main Page)

* Task creation + list
* Category filters
* Revisits section
* Daily score + weekly momentum
* Long tasks overview
* Calendar preview
* Top bar (streak, theme, notifications, account)

---

### 📈 Statistics Page

* Streak tracking
* Daily scores
* Momentum graphs
* Project progress insights



### 🔁 Return Stack

* Due items
* Upcoming items
* All revisits/tasks

---

### 📝 Notes Page

* Create and manage notes

---

## 🔄 Sync & Offline Support

* Works offline with local queue
* Syncs when back online
* Conflict-safe merging
* Additive timer logs (no data loss)

---

## 📤 Data Ownership

* Full export (CSV / Excel)
* Login restores data across devices
* Account deletion = full wipe

---

## 🎨 UI/UX System

* Spatial UI design
* Glassmorphism & liquid glass effects
* Scenic blurred backgrounds
* Floating components
* Smooth animations (GSAP, Framer Motion)

---

## 🔐 Security

* Row Level Security (RLS)
* Input validation & sanitization
* Rate limiting
* Secure environment variables
* OWASP best practices

---

## 🧩 Tech Stack

* **Frontend (Web):** Next.js + React + TypeScript
* **Mobile:** React Native
* **Backend:** Supabase (PostgreSQL, Auth, Realtime)
* **State Management:** Zustand + TanStack Query
* **UI:** Tailwind + shadcn/ui + animation libraries

---

## 🚀 Future Roadmap

### 🌐 Social & Community

* Community challenges
* Public leaderboards
* User profiles

### 🎮 XP System

* Earn XP for:

  * Task completion
  * Revisits
* XP based on:

  * Task difficulty
  * Duration
  * Eisenhower priority
* Leaderboard ranking system

---

## 🧠 Product Philosophy

Growvia is built on one idea:

> “Track the work. See your growth.”

It is not just a task manager.

It is a **system for building discipline, consistency, and measurable progress.**

---

## 📌 Status

🚧 In active development
🎯 Building toward production-grade SaaS

---

## 🤝 Contribution

Currently private / early-stage.
Will open for contributions in future phases.

---

## 📄 License

To be decided.
