# 03 — App Flow: Navigation & User Journey

---

## Navigation Structure

**Left sidebar** (always visible on desktop):
- Fixed width ~220px
- Shows all main sections with icons
- Active section highlighted
- Bottom: Settings icon + user name

**Top bar** (per section):
- Section title
- Section-specific actions (e.g. "New Note", "Process Inbox", "New Task")

**No modals for creation** — new items open inline or in a split panel.

---

## All Pages / Sections

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Today at a glance — tasks, schedule strip, inbox count, protocol snapshot |
| `/inbox` | **Inbox** | Raw captures. Quick input bar at top. List of unprocessed notes below |
| `/journal` | **Journal** | One entry per day. Calendar picker on left. Editor on right |
| `/wiki` | **Wiki** | All wiki pages listed. Click to open. Create new page manually or via AI |
| `/wiki/:slug` | **Wiki Page** | Full page editor with markdown + wikilinks |
| `/protocol` | **Protocol** | Personal profile. Skills, goals, decisions, timeline. Read + edit |
| `/tasks` | **Tasks** | All tasks. Filter by today / upcoming / done / tag |
| `/timetable` | **Timetable** | Weekly grid. Drag to create blocks. Click to edit |
| `/daily` | **Daily Note** | Today: tasks due today + schedule blocks + journal entry + habit checkboxes |
| `/ai` | **AI Brain** | Chat interface — ask questions about your notes. Also shows AI processing log |
| `/settings` | **Settings** | Name, API key, theme, Protocol preferences |

---

## First Launch Flow

```
Open app (first time)
  └─► Onboarding screen
        ├── "What's your name?" (sets protocol owner name)
        ├── "Paste your Anthropic API key" (saved to localStorage)
        └── "Let's go" → Dashboard

  Dashboard shows:
        ├── Empty state: "Your inbox is empty — capture your first thought"
        ├── Journal prompt: "Start today's entry"
        └── Protocol: skeleton with name filled in
```

---

## Core User Journey 1 — Quick Capture → AI Processing

```
1. User hits the app, has a random thought
2. Goes to Inbox (or uses keyboard shortcut ⌘K → "capture")
3. Types note in the input bar at top → hits Enter
4. Note appears in Inbox list with timestamp
5. Later that day/week, user clicks "Process Inbox" button
6. AI Brain reads all unprocessed inbox notes
7. For each note:
   a. Extracts key ideas → creates or updates wiki pages
   b. Detects personal info (new skill, decision, goal) → updates Protocol
   c. Archives the raw note to processed state
8. User sees processing log in real-time (streaming)
9. Wiki now has new/updated pages
10. Protocol has new entries with timestamps
```

---

## Core User Journey 2 — Daily Note (Morning Routine)

```
1. User opens app in morning
2. Clicks "Daily Note" (or it's the default on open)
3. Sees today's view:
   a. Tasks due today (from Tasks section)
   b. Today's schedule blocks (from Timetable)
   c. Today's journal entry (blank, ready to type)
   d. Habit checkboxes (if set up)
4. Writes morning journal entry
5. Checks off tasks as day progresses
6. Evening: adds a few inbox captures from the day
7. Next morning: cycle repeats
```

---

## Core User Journey 3 — Review My Protocol

```
1. User goes to Protocol section
2. Sees auto-generated profile:
   a. Skills list (tech, creative, academic)
   b. Current goals (short + long term)
   c. Timeline — chronological log of entries added by AI
   d. Patterns — what the AI has noticed
   e. Open questions
3. User can manually edit any field
4. User can ask AI: "What should I focus on this week based on my goals?"
5. AI reads Protocol + recent journal + tasks → gives a response
```

---

## Empty States

| Section | Empty State Message |
|---|---|
| Inbox | "Nothing here yet. Capture a thought — it takes 3 seconds." |
| Journal | "No entry for today yet. What's on your mind?" |
| Wiki | "Your knowledge base is empty. Process your inbox to start building it." |
| Tasks | "No tasks. Add one, or let the AI pull them from your notes." |
| Protocol | "Your Protocol is blank. It'll fill in automatically as you use Cortex." |
| Timetable | "No blocks yet. Add your class schedule to get started." |

---

## Error States

| Error | Behaviour |
|---|---|
| No API key set | AI features show: "Add your Anthropic API key in Settings to use AI features." |
| API call fails | Toast: "AI request failed. Check your API key and connection." Processing does not proceed. |
| No content in Inbox | "Process Inbox" button is disabled with tooltip: "Nothing to process yet." |
| Dexie/IndexedDB error | Toast: "Storage error — your browser may be blocking local storage." |

---

## Modals / Overlays

- **New Task** — inline form below task list header (no modal)
- **New Wiki Page** — inline prompt in wiki list
- **Timetable block editor** — small popover on click
- **Keyboard shortcut help** — `?` key opens overlay
- **Settings** — full page, not a modal

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ + N` | New inbox capture (focus input) |
| `⌘ + J` | Go to today's journal |
| `⌘ + K` | Command palette (search + navigate) |
| `⌘ + P` | Process inbox |
| `?` | Show keyboard shortcuts |
