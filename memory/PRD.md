# PhD Compass — Product Requirements Document

## Overview
PhD Compass is a mobile-first personal research journal, progress tracker, and reflection system for a PhD student researching low cycle fatigue behavior of Wire DED-printed NAB alloys.

## Architecture
- **Framework:** Expo (React Native) with web support
- **Storage:** AsyncStorage (client-side, no backend/database)
- **Auth:** None (single-user private tool)
- **Navigation:** Expo Router with 5-tab bottom navigation

## Modules

### Module 1: Journal (Home Screen)
- Daily reflection with 5 text fields (worked on, learned, surprised/confused, honest check, tomorrow's intention)
- 6 pillar tag chips (P0-P5) - toggleable, multiple selection
- 3 skill track chips (Research/Coding/Entrepreneurial) - radio selection
- Auto-save every 30 seconds + on field blur
- Streak counter (resets after 2 missed days)
- History view with search
- Read-only past entry viewer

### Module 2: Progress
- **Dashboard:** 3 skill track progress cards with weekly progress bars, 4-week bar chart
- **Milestones:** 11 pre-populated research milestones with 3-state status toggle (Not Started → In Progress → Completed), expandable notes, NAB warning banner
- **Coursework:** 3 pre-populated courses with expandable key concepts sections

### Module 3: Review
- Weekly/Monthly/Quarterly sub-tabs
- Auto-generated pillar scorecard from journal tags
- Skill track session summary
- P0 (Deep Grounding) special warning if score is 0
- 4 weekly reflection prompts, +3 monthly, +3 quarterly
- Save and PDF export (via browser print)

### Module 4: SOPs
- 7 pre-populated SOPs with categories (Lab Protocol, Data Processing, Analysis, Administrative)
- Expandable cards with inline editing
- Numbered step management (add, edit, delete, reorder)
- Add new SOP form with title and category selection

### Module 5: Vision
- North Star: 3 text fields (legacy, contribution, post-PhD direction)
- Who I Must Become: 4 identity gap cards (Mindset, Skill Set, Knowledge, Systems) each with current/required state
- Six Pillars reference accordion (read-only)
- Last reviewed indicator (amber warning after 30 days)

### Settings
- Theme toggle (Light/Dark/System)
- Reminder time display
- Backup (JSON export), Restore (JSON import)
- Journal PDF export
- About section
- Clear all data (danger zone)

## Design System
- **Primary:** #1A8A7D (muted teal)
- **Text:** #2D2D2A (light) / #F0F0F0 (dark)
- **Background:** #FAFAF8 (light) / #1A1A1A (dark)
- **Warning:** #C4820B (amber)
- **Cards:** 12px radius, 1px border
- **Touch targets:** 44px minimum
- **Dark mode:** Full support with CSS variable-like theme context

## Data Models
- JournalEntry, Vision, Milestone, Course, SOP, WeeklyReview, AppSettings
- All stored as JSON in AsyncStorage

## Pre-populated Content
- 11 research milestones (Cast NAB characterization through First journal paper draft)
- 7 SOPs (SEM, EDS, Hardness, Heat treatment, Image organization, Fatigue prep, Backup)
- 3 courses (Plasticity, Kinetics, Electromagnetic Properties)
- 6 pillar descriptions

## Welcome Experience
- First-load modal: "Welcome to PhD Compass" with two CTAs
- Dismissed permanently after first interaction
