# Gamification System Architecture

## Overview
Production-grade gamification system for Growvia productivity app with modular, scalable architecture.

## Core Philosophy
- Encourage daily app usage
- Reward actual productivity (not fake engagement)
- Create competition (leaderboards + leagues)
- Build identity (levels, titles, badges)
- Create urgency (promotion/relegation risk)
- Visualize progress clearly

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Dates**: date-fns

---

## Database Schema

### Core Tables

#### 1. `user_profiles`
Extended user profile for gamification data
```sql
- id (UUID, FK to auth.users)
- total_xp (integer, default: 0)
- current_level (integer, default: 1)
- current_league (text, default: 'bronze')
- current_streak (integer, default: 0)
- max_streak (integer, default: 0)
- total_tasks_completed (integer, default: 0)
- last_check_in (timestamp)
- streak_freezes_available (integer, default: 0)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `xp_logs`
Append-only log of all XP events
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- xp_amount (integer, can be negative)
- source (text: 'task_completion', 'revisit_completion', 'long_task', 'daily_check_in', 'streak_bonus', 'level_bonus', 'penalty')
- source_id (UUID, nullable - reference to task/revisit/etc)
- week_number (integer, for weekly calculations)
- created_at (timestamp)
```

#### 3. `levels`
Level configuration
```sql
- level (integer, PK)
- title (text)
- xp_threshold (integer)
- bonus_xp (integer, XP rewarded on reaching this level)
```

#### 4. `leagues`
League configuration
```sql
- id (text, PK: 'bronze', 'silver', 'gold', 'platinum', 'diamond')
- name (text)
- min_xp_weekly (integer)
- promotion_count (integer, default: 3)
- relegation_count (integer, default: 3)
- users_per_league (integer, default: 100)
- rank_min (integer)
- rank_max (integer)
```

#### 5. `weekly_scores`
Weekly league scores
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- league_id (text, FK to leagues)
- week_number (integer)
- year (integer)
- base_xp (integer)
- consistency_multiplier (float)
- effective_xp (integer)
- rank (integer)
- previous_rank (integer, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 6. `badges`
Badge/achievement definitions
```sql
- id (UUID, PK)
- name (text)
- description (text)
- icon (text)
- category (text: 'streak', 'tasks', 'xp', 'time', 'special')
- requirement_type (text)
- requirement_value (integer)
- rarity (text: 'common', 'rare', 'epic', 'legendary')
```

#### 7. `user_badges`
User's unlocked badges
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- badge_id (UUID, FK to badges)
- unlocked_at (timestamp)
```

#### 8. `daily_scores`
Daily activity tracking for consistency
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- date (date)
- score (integer)
- tasks_completed (integer)
- xp_earned (integer)
- created_at (timestamp)
```

#### 9. `weekly_reset_history`
History of weekly resets
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- week_number (integer)
- year (integer)
- previous_league (text)
- new_league (text)
- previous_rank (integer)
- new_rank (integer)
- result (text: 'promoted', 'stayed', 'relegated')
- summary (text, JSON)
```

---

## System Components

### 1. XP System
**Location**: `apps/web/src/lib/gamification/xp/`

- **XP Sources**:
  - Task completion: +10-50 XP (based on duration)
  - Revisit completion: +15-75 XP (multiplied by revisit count)
  - Long task progress: +5 XP per 30 min
  - Daily check-in: +5 XP

- **XP Rules**:
  - Must reward ACTION, not passive usage
  - Daily check-in is minor nudge, not main source
  - No XP abuse (duplicate prevention)

### 2. Levels & Titles
**Location**: `apps/web/src/lib/gamification/levels/`

**Level Progression**:
```
Level 1-3: Amateur I, II, III (0-100 XP)
Level 4-5: Focused I, II (100-250 XP)
Level 6-7: Disciplined I, II (250-500 XP)
Level 8-9: Master I, II (500-1000 XP)
Level 10+: Monk (1000+ XP)
```

### 3. League System
**Location**: `apps/web/src/lib/gamification/leagues/`

**Weekly Competition**:
- Users compete based on WEEKLY XP
- Top 3 → promoted
- Bottom 3 → relegated
- Rest → stay
- Weekly reset

**Consistency Weighting**:
```
Effective XP = Base XP × Consistency Multiplier
Consistency Multiplier = Active Days / 7
```

**Leagues**:
- Bronze (0-100 XP/week)
- Silver (100-250 XP/week)
- Gold (250-500 XP/week)
- Platinum (500-1000 XP/week)
- Diamond (1000+ XP/week)

### 4. Leaderboard System
**Location**: `apps/web/src/lib/gamification/leaderboard/`

**Types**:
- Global leaderboard
- Friends leaderboard

**Features**:
- Rank position
- XP value
- Movement indicators (↑ ↓)
- Highlight current user

### 5. Daily Check-In
**Location**: `apps/web/src/lib/gamification/checkin/`

**Rules**:
- Once per day
- +5 XP after few seconds
- Not spammable
- Animation: "+5 XP Daily Check-in"

### 6. Streak System
**Location**: `apps/web/src/lib/gamification/streak/`

**Rules**:
- Depends on daily score threshold (configurable)
- Score >= threshold → streak continues
- Score < threshold → streak breaks

**Streak Freeze**:
- Users can spend XP to save streak
- Prompt: "Use streak freeze?" when about to break

### 7. Badges / Achievements
**Location**: `apps/web/src/lib/gamification/badges/`

**Examples**:
- 3-day streak
- 7-day streak
- 30-day streak
- 100 hours completed
- 50 tasks completed

**UI**:
- Locked badges (greyed)
- Unlocked badges (highlighted)

### 8. Weekly XP Graph
**Location**: `apps/web/src/lib/gamification/graph/`

**Display**:
- XP per day (Mon–Sun)
- Animated line graph
- Highlight peak day
- Smooth transitions

### 9. Personal Stats
**Location**: `apps/web/src/lib/gamification/stats/`

**Display**:
- Total XP
- Max streak
- Current streak
- Current league
- Level
- Total tasks completed

### 10. Weekly Reset System
**Location**: `apps/web/src/lib/gamification/reset/`

**Cinematic Result Screen**:
- Promoted 🎉
- Stayed 😐
- Relegated 😬

**Include**:
- XP summary
- Rank change
- Animation effects

---

## API Routes & Server Actions

**Location**: `apps/web/src/actions/gamification/`

### Server Actions
- `getUserGamificationData()` - Get all gamification data
- `awardXP(amount, source, sourceId)` - Award XP to user
- `dailyCheckIn()` - Process daily check-in
- `getLeaderboard(type, limit)` - Get leaderboard data
- `getUserWeeklyStats()` - Get user's weekly stats
- `useStreakFreeze()` - Use streak freeze
- `getBadges(userId)` - Get user's badges
- `getWeeklyXPGraph(userId, week)` - Get weekly XP data
- `processWeeklyReset()` - Process weekly league resets (cron job)

---

## Custom Hooks

**Location**: `apps/web/src/hooks/gamification/`

### Hooks
- `useXP()` - XP state and operations
- `useLeaderboard()` - Leaderboard data and updates
- `useLeague()` - League status and pressure
- `useBadges()` - Badges state
- `useStreak()` - Streak state and operations
- `useDailyCheckIn()` - Daily check-in state
- `useWeeklyGraph()` - Weekly XP graph data

---

## UI Components

**Location**: `apps/web/src/components/gamification/`

### Page Components
- `GamificationPage.tsx` - Main page
- `GamificationHeader.tsx` - Level badge, title, XP progress bar
- `LeagueCard.tsx` - Current league, rank, indicators
- `Leaderboard.tsx` - Scrollable leaderboard list
- `XPGraph.tsx` - Weekly XP trend graph
- `StatsOverview.tsx` - Stats cards
- `BadgesSection.tsx` - Badge grid

### Widget Components
- `LeaguePressure.tsx` - "+20 XP to reach promotion" indicator
- `XPProgress.tsx` - Animated XP progress bar
- `StreakCounter.tsx` - Streak display with freeze option
- `BadgeCard.tsx` - Individual badge display
- `LeaderboardRow.tsx` - Single leaderboard entry
- `WeeklyResultScreen.tsx` - Cinematic weekly reset result

### Animation Components
- `XPGainAnimation.tsx` - XP gain particle effect
- `LevelUpAnimation.tsx` - Level up celebration
- `PromotionAnimation.tsx` - League promotion effect
- `BadgeUnlockAnimation.tsx` - Badge unlock effect

---

## State Management

**Location**: `apps/web/src/store/gamification.ts`

**Zustand Store**:
```typescript
interface GamificationStore {
  // User data
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile) => void

  // XP
  totalXP: number
  currentLevel: number
  xpToNextLevel: number
  addXP: (amount: number) => void

  // League
  currentLeague: string
  leagueRank: number
  leaguePressure: { toPromotion: number; toRelegation: number }

  // Streak
  currentStreak: number
  maxStreak: number
  streakFreezes: number

  // Badges
  unlockedBadges: Badge[]
  lockedBadges: Badge[]
  unlockBadge: (badgeId: string) => void

  // Leaderboard
  leaderboard: LeaderboardEntry[]

  // Weekly data
  weeklyXP: number[]
  weeklyRank: number

  // Check-in
  lastCheckIn: Date | null
  canCheckIn: boolean
}
```

---

## Edge Cases & Handling

### 1. Offline XP Sync
- Queue XP events locally
- Sync when connection restored
- Deduplicate events

### 2. Duplicate XP Prevention
- Check `xp_logs` before awarding
- Use idempotency keys
- Transaction-based operations

### 3. Timezone Differences
- Store all times in UTC
- Convert to user timezone for display
- Use `date-fns` for timezone handling

### 4. Week Boundary Reset
- Cron job at Sunday midnight (UTC)
- Transaction-based reset
- Atomic operations

### 5. Streak Calculation Errors
- Use `daily_scores` table as source of truth
- Recalculate if inconsistency detected
- Fallback to user profile data

### 6. Leaderboard Ties
- Use timestamp as tiebreaker
- Show "Tied" indicator
- No ranking changes for ties

---

## Performance Considerations

### Database Indexes
- `xp_logs(user_id, created_at)`
- `weekly_scores(user_id, week_number, year)`
- `daily_scores(user_id, date)`
- `user_badges(user_id)`

### Caching
- Cache user profile data (5 min TTL)
- Cache leaderboard data (1 min TTL)
- Use Supabase Realtime for live updates

### Optimization
- Batch XP awarding operations
- Use database functions for complex calculations
- Implement pagination for leaderboards

---

## Security Considerations

### RLS Policies
- All tables use Row Level Security
- Users can only see their own data
- Admin roles for system operations

### XP Abuse Prevention
- Rate limiting on XP awarding
- Validation on source events
- Audit trail in `xp_logs`

### Streak Freeze Limits
- Max 1 streak freeze per week
- Cost scales with streak length
- Transaction-based deduction

---

## Migration Strategy

### Phase 1: Core Tables
- Create core gamification tables
- Migrate existing users to `user_profiles`
- Initialize XP logs from historical data

### Phase 2: Logic Implementation
- Implement XP calculation logic
- Build level progression system
- Create league assignment algorithm

### Phase 3: UI Components
- Build gamification page
- Implement animations
- Create weekly reset screen

### Phase 4: Integration
- Integrate with task completion
- Integrate with revisit system
- Connect to dashboard notifications

### Phase 5: Testing & Launch
- Unit tests for all logic
- Integration tests for workflows
- Beta testing with small group
- Full rollout

---

## Monitoring & Analytics

### Key Metrics
- Daily active users (DAU)
- Weekly active users (WAU)
- XP awarded per day
- Level progression rate
- League movement
- Streak completion rate
- Badge unlock rate
- Retention rates

### Alerts
- XP awarding errors
- Streak calculation failures
- League reset failures
- Database performance issues

---

## Future Enhancements

### Short-term
- XP multipliers based on difficulty
- Custom league creation
- Badge crafting system
- Streak freeze marketplace

### Long-term
- Guild/Team system
- Seasonal events
- Custom badge creation
- Cross-platform sync
- Achievement sharing

---

## Documentation

- API Documentation: `/docs/gamification-api.md`
- Component Props: `/docs/gamification-components.md`
- Database Schema: `/docs/gamification-schema.md`
- Migration Guide: `/docs/gamification-migration.md`
