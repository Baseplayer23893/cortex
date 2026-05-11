# 05 — Backend Schema: Data Model

> **Hybrid local-first.** All data stored in **IndexedDB via Dexie.js** locally.
> When signed in, data syncs to **Supabase PostgreSQL** in the background.
> Every table has a `userId` field linking to the Supabase auth user.

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
  userId?: string           // Supabase auth user ID (null if local-only)
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
  userId?: string           // Supabase auth user ID
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
  userId?: string           // Supabase auth user ID
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
  userId?: string           // Supabase auth user ID
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

## Supabase Auth

| | |
|---|---|
| Provider | Supabase Auth |
| Methods | Google OAuth, Magic Link |
| User table | Auto-managed by Supabase (`auth.users`) |
| Session | JWT, auto-refreshed by `@supabase/supabase-js` |

## Supabase Table Schema (mirrors Dexie)

Each Dexie table has a corresponding Supabase table. All tables include:
- `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` uuid REFERENCES auth.users NOT NULL
- `created_at` timestamptz DEFAULT now()

```sql
-- Row Level Security on every table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);
-- (repeat for all tables)
```

## Sync Layer (`src/lib/sync.ts`)

```typescript
// After every Dexie write, call sync in background:
export async function syncToSupabase(table: string, record: any) {
  const session = await supabase.auth.getSession()
  if (!session.data.session) return  // not logged in, skip
  await supabase.from(table).upsert({
    ...record,
    user_id: session.data.session.user.id
  })
}

// On login, pull all cloud data into Dexie:
export async function pullFromSupabase() {
  const { data: notes } = await supabase.from('notes').select('*')
  await db.notes.bulkPut(notes)
  // repeat for all tables
}
```

---

## Data Export (V2)

Plan for a future "Export" button in Settings:
- Export all tables as a single JSON file
- Export journal entries as individual `.md` files
- Export wiki pages as individual `.md` files (Obsidian-compatible)
