# 🚀 Growvia

> A gamified productivity system that helps you track not just tasks — but real progress.

Growvia is a **cross-platform productivity OS** designed for students, professionals, and high-performance individuals who want to plan their work, track actual time spent, build long-term projects, maintain consistency, and visualize growth. 

Unlike traditional to-do apps, Growvia focuses on **time, discipline, and measurable progress**.

---

## ✨ Features

### 🔹 1. Authentication & System
- **Secure Auth**: Email & Password authentication via Supabase Auth.
- **Real-time Sync**: Cross-device sync & offline-first architecture with conflict-safe merging.
- **Data Privacy**: Full CSV/Excel export and complete data wipe capabilities.

### 🔹 2. Gamified Daily Tasks
- **Task Management**: Create tasks with categories, planned durations, and priority levels.
- **Eisenhower Matrix**: Organize tasks visually by urgency and importance.
- **Timer Engine**: Built-in task timer for tracking real effort with append-only logs for session history.
- **Progress Tracking**: Daily scores, streaks, and weekly momentum visualization.

### 🔹 3. Long-Term Projects
- **Goal Linking**: Link daily tasks to multi-day projects (many-to-many relationships).
- **Aggregate Progress**: Circular progress visualization based on real-time effort invested in linked tasks.

### 🔹 4. Spaced Repetition (Revisits)
- **Review Schedules**: Add tasks or topics to revisit at custom intervals.
- **History Tracking**: Full history of completions and review counts.

### 🔹 5. Custom Habit Challenges
- **Visual Tracking**: Grid-based UI (contribution-style) for challenges like "75 Hard" or "100 Days of Code".
- **Flexible Check-ins**: Daily, weekly, or hourly tracking.

### 🔹 6. Advanced Organization
- **Lightweight Notes**: A scratchpad system to complement your tasks.
- **Calendar View**: Time-based visualization and drag-and-drop planning.
- **Return Stack**: Dedicated view for due and upcoming priority items.

---

## 🎮 Gamification Engine

The core of Growvia is its deep gamification system, designed to reward consistency and deep work.

- **XP System**: Earn XP for task completion (duration + priority), revisits, and long-term project milestones.
- **15-Tier Leveling**: Progress from "Amateur I" to "Transcendent" with unlockable titles and bonuses.
- **Weekly Leagues**: Compete in 5 league tiers (Bronze → Diamond) with weekly promotion/relegation based on consistency-weighted performance.
- **Streak System**: Maintain daily streaks with a threshold-based score system. Includes "Streak Freeze" protection.
- **Achievement Badges**: 16+ pre-configured badges across 5 categories (Streak, Tasks, XP, Time, Special).
- **Cinematic Experience**: Animated "Weekly Reset" screens with confetti, rank change reveals, and detailed performance summaries.

---

## 🎨 UI/UX System

- **Spatial Design**: Modern glassmorphism and liquid glass effects.
- **Premium Aesthetics**: Scenic blurred backgrounds, smooth transitions, and floating components.
- **Dynamic Interactions**: Micro-animations powered by **Framer Motion 12** and **GSAP**.
- **Responsive Layout**: Seamlessly adapted for deep work on web and quick tracking on mobile.

---

## 🧩 Tech Stack

Growvia utilizes a modern, production-grade stack for performance and scalability:

- **Frontend (Web):** [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query](https://tanstack.com/query/latest)
- **Animations:** Framer Motion 12, GSAP, and `@number-flow/react`

---

## 🛠️ Project Structure

This project is a **monorepo** managed by [Turborepo](https://turbo.build/):

```
├── apps/
│   ├── web/        # Next.js web application (Primary Client)
│   └── mobile/     # React Native app (Coming Soon)
├── packages/
│   └── shared/     # Shared logic, schemas, and types
├── databases/      # SQL migrations and schema definitions
└── explain/        # Detailed documentation for system architecture
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- npm or pnpm
- A Supabase project

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/growvia.git
   cd growvia
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` in `apps/web` with your Supabase credentials.
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🧠 Philosophy

> “Track the work. See your growth.”

Growvia is built on the belief that discipline is built through measurable progress. It’s more than a task manager—it’s a system for building consistency and seeing your evolution over time.

---

## 📌 Status
🚧 **In active development** - Production-ready gamification engine and core productivity modules.

## 📄 License
To be decided.
