# 05 — Backend Schema: Data Model

> No traditional backend. All data stored locally in **IndexedDB via Dexie.js**.
> No server. No auth. No migrations. Just a typed local database.

---

## Database Setup (`src/db/db.ts`)

```typescript
import Dexie, { Table } from 'dexie'

export class CortexDB extends Dexie {
  notes!: Table<Note>
  journal!: Table<JournalEntry>
  wiki!: Table<WikiPage>
  tasks!: Table<Task>
  timetable!: Table<TimetableBlock>
  protocol!: Table<ProtocolEntry>
  habitLogs!: Table<HabitLog>
  aiLogs!: Table<AILog>

  constructor() {
    super('CortexDB')
    this.version(1).stores({
      notes:          '++id, createdAt, status, *tags',
      journal:        '++id, date',
      wiki:           '++id, slug, updatedAt, *tags',
      tasks:          '++id, dueDate, status, priority, *tags',
      timetable:      '++id, dayOfWeek, startTime',
      protocol:       '++id, category, createdAt',
      habitLogs:      '++id, date, habitId',
      aiLogs:         '++id, createdAt, type',
    })
  }
}

export const db = new CortexDB()
```

---

## Tables

### `notes` — Inbox captures

```typescript
interface Note {
  id?: number
  content: string           // raw text of the note
  createdAt: Date
  status: 'inbox' | 'processed' | 'archived'
  tags?: string[]           // optional user-added tags
  wikiLinks?: string[]      // slugs of wiki pages created from this note
  aiProcessedAt?: Date      // when AI last touched it
}
```

### `journal` — Daily journal entries

```typescript
interface JournalEntry {
  id?: number
  date: string              // ISO date string: "2025-05-12"
  content: string           // markdown content
  wordCount: number
  createdAt: Date
  updatedAt: Date
  aiPromptUsed?: string     // the AI prompt that was suggested (if any)
}
```

Index: `date` (unique-ish — one entry per day enforced in app logic)

### `wiki` — Knowledge base pages

```typescript
interface WikiPage {
  id?: number
  slug: string              // url-safe title: "machine-learning-basics"
  title: string             // display title: "Machine Learning Basics"
  content: string           // markdown content with [[wikilinks]]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: 'user' | 'ai' // who created this page
  sourceNoteIds?: number[]  // which inbox notes spawned this page
}
```

Index: `slug` (must be unique — enforced in app logic)

### `tasks` — Todos and tasks

```typescript
interface Task {
  id?: number
  title: string
  description?: string      // optional longer note
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string          // ISO date: "2025-05-15"
  tags?: string[]
  createdAt: Date
  completedAt?: Date
  sourceNoteId?: number     // if extracted from an inbox note by AI
}
```

### `timetable` — Weekly schedule blocks

```typescript
interface TimetableBlock {
  id?: number
  title: string             // e.g. "Machine Learning Lecture"
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday
  startTime: string         // "09:00"
  endTime: string           // "10:30"
  color?: string            // hex or token: "#7c3aed"
  location?: string         // "Room 204" or "Zoom"
  recurring: boolean        // repeats every week
  notes?: string
}
```

### `protocol` — Personal profile entries (AI-maintained)

```typescript
interface ProtocolEntry {
  id?: number
  category: 'skill' | 'goal' | 'decision' | 'pattern' | 'question' | 'milestone'
  content: string           // the actual entry text
  createdAt: Date
  sourceNoteId?: number     // which note triggered this entry
  aiGenerated: boolean      // true = AI added it, false = user manually added
}

// The full Protocol is assembled by querying all ProtocolEntry rows
// and grouping by category. The "header" fields (name, short/long goals)
// are stored in localStorage as part of settings.
```

### `habitLogs` — Daily habit tracking

```typescript
interface HabitLog {
  id?: number
  habitId: string           // e.g. "exercise", "read", "meditate" — defined in settings
  date: string              // ISO date: "2025-05-12"
  completed: boolean
  note?: string             // optional note about the habit
}
```

Habits themselves (names, icons) stored in `localStorage` as a JSON array.

### `aiLogs` — AI processing history

```typescript
interface AILog {
  id?: number
  type: 'process-inbox' | 'journal-prompt' | 'brain-chat' | 'protocol-update'
  createdAt: Date
  input: string             // summary of what was sent
  output: string            // summary or full response
  noteIdsProcessed?: number[]
  tokensUsed?: number
}
```

---

## localStorage Keys

| Key | Value | Description |
|---|---|---|
| `cortex:settings` | JSON object | Name, theme, accent color, API key, habits config |
| `cortex:theme` | `'dark'` \| `'light'` | Current theme |
| `cortex:apiKey` | string | Anthropic API key |
| `cortex:userName` | string | User's name (used in Protocol) |
| `cortex:habits` | JSON array | Habit definitions: `[{id, name, icon}]` |
| `cortex:onboarded` | `'true'` | Whether first-launch flow is done |

---

## Relationships

```
notes (1) ──────────► wiki (many)
  via: wiki.sourceNoteIds[]

notes (1) ──────────► protocol (many)
  via: protocol.sourceNoteId

notes (1) ──────────► tasks (many)
  via: tasks.sourceNoteId

journal (1) ─────────► no FK — standalone per date

timetable ───────────► no FK — standalone blocks

habitLogs (many) ────► habits (in localStorage, by habitId)
```

---

## No Auth / No RLS

Single-user local app. No authentication, no row-level security, no user IDs. All data belongs to the one person running the app on their machine.

---

## Data Export (V2)

Plan for a future "Export" button in Settings:
- Export all tables as a single JSON file
- Export journal entries as individual `.md` files
- Export wiki pages as individual `.md` files (Obsidian-compatible)
