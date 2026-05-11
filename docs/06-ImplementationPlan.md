# 06 — Implementation Plan: Step-by-Step Build Sequence

---

## Overview

Build in strict dependency order. Never build UI for a feature before its data layer exists.
Each phase has a clear "done" criteria before moving on.

---

## Phase 1 — Project Setup

**Goal:** Runnable app shell with routing and styling working.

- [ ] `npm create vite@latest cortex -- --template react-ts`
- [ ] Install core deps: `tailwindcss`, `shadcn/ui`, `react-router-dom`, `zustand`, `dexie`, `lucide-react`, `date-fns`
- [ ] Configure Tailwind + shadcn (init, set theme to dark, configure CSS variables from design brief)
- [ ] Set up folder structure: `pages/`, `components/ui/`, `components/layout/`, `store/`, `db/`, `lib/`, `types/`
- [ ] Create `App.tsx` with React Router routes (all pages as empty placeholder components)
- [ ] Build `Layout.tsx` — sidebar + main content area shell
- [ ] Build `Sidebar.tsx` — nav items with icons, active state, bottom user/settings area
- [ ] Add fonts: import Geist + Lora via Fontsource or Google Fonts

**Done when:** `npm run dev` shows the sidebar and you can click between empty page placeholders.

---

## Phase 2 — Database Layer

**Goal:** All data models defined and queryable. No UI yet.

- [ ] Create `src/db/db.ts` — full Dexie schema with all 8 tables (as per Schema doc)
- [ ] Create TypeScript interfaces in `src/types/index.ts`
- [ ] Write Zustand stores for each entity: notes, journal, wiki, tasks, timetable, protocol, settings
- [ ] Each store has: `items`, `fetchAll()`, `add()`, `update()`, `delete()`, `loading`, `error`
- [ ] Create `src/lib/utils.ts` — slugify, formatDate, truncate helpers
- [ ] Add localStorage helpers in `settingsStore.ts` (API key, name, theme, habits)
- [ ] Write a quick `db-test.ts` script to verify all tables insert and query correctly (delete after)

**Done when:** You can open browser devtools and manually call store methods to add and retrieve data.

---

## Phase 2.5 — Supabase Setup + Auth

**Goal:** Auth working, Supabase connected, sync layer scaffolded.

- [ ] Create Supabase project at supabase.com → get `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- [ ] Add to `.env.local`:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
- [ ] Install: `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts` — init Supabase client
- [ ] Create all Supabase tables (mirror Dexie schema) with SQL in Supabase dashboard
- [ ] Enable RLS on every table + add `users own their rows` policy
- [ ] Enable Google OAuth in Supabase Auth dashboard
- [ ] Create `src/lib/sync.ts` — `syncToSupabase()` and `pullFromSupabase()` helpers
- [ ] Create `src/lib/auth.ts` — `signInWithGoogle()`, `signInWithMagicLink()`, `signOut()`, `getUser()`
- [ ] Wire auth state to `settingsStore` — store `userId`, `isLoggedIn`, `syncEnabled`
- [ ] On login → call `pullFromSupabase()` → populate all Dexie tables

**Done when:** Google login works, session persists on reload, Supabase tables exist with RLS.

---

## Phase 3 — Onboarding + Settings

**Goal:** First-launch experience and Settings page work.

- [ ] Build `Settings.tsx` page:
  - Name input
  - Anthropic API key input (password field, show/hide toggle)
  - Theme toggle (dark/light)
  - Habits config (add/remove/reorder habits)
  - "Clear all data" danger button
- [ ] Build onboarding overlay (shows if `cortex:onboarded` is not set):
  - Step 1: Enter name
  - Step 2: Enter MiniMax API key
  - Step 3: Sync option — "Sign in with Google to sync across devices" OR "Use locally only"
  - Step 4: Done → set `cortex:onboarded = 'true'` → redirect to Dashboard
- [ ] Add sync status indicator in sidebar footer (cloud icon — synced / syncing / offline / local-only)
- [ ] Wire Settings form to `settingsStore`
- [ ] Validate API key field is not empty before allowing AI features (show banner if missing)

**Done when:** First launch shows onboarding. Settings page saves and reloads correctly.

---

## Phase 4 — Inbox (Core Capture)

**Goal:** User can capture notes and see them listed.

- [ ] Build `Inbox.tsx`:
  - Large text input at top with "Capture a thought..." placeholder
  - Enter key or "Capture" button → saves note to DB with status `inbox`
  - Notes list below — each item: timestamp, content preview, status badge
  - "Archive" and "Delete" actions per note
- [ ] Wire to `notesStore`
- [ ] Empty state: illustrated message with prompt to capture first note
- [ ] Inbox count shown in sidebar badge

**Done when:** Can type a note, hit Enter, see it appear in the list. Count updates in sidebar.

---

## Phase 5 — Tasks

**Goal:** Full task management working.

- [ ] Build `Tasks.tsx`:
  - Groups: Today / Upcoming / Someday / Done
  - Each task: checkbox, title, due date chip, priority dot, tag pills
  - Inline add: click "+ Add task" → inline form with title + due date + priority
  - Click task title → expand to show description + edit fields
  - Filter bar: All / Today / This Week / By Tag
- [ ] Wire to `tasksStore`
- [ ] Completing a task: strike-through animation → moves to Done group
- [ ] Empty state per group

**Done when:** Can create, complete, and filter tasks.

---

## Phase 6 — Timetable

**Goal:** Weekly schedule grid working.

- [ ] Build `Timetable.tsx`:
  - 7-column grid (Mon–Sun), time rows 7am–10pm
  - Render `TimetableBlock` records as colored rectangles in correct cells
  - Click empty slot → small popover form: title, start/end time, color, location, recurring
  - Click existing block → edit popover
  - Delete block button
- [ ] Wire to `timetableStore`
- [ ] Show "today" column with different bg tint

**Done when:** Can add, view, and delete timetable blocks for each day.

---

## Phase 7 — Journal

**Goal:** Daily journal with editor working.

- [ ] Install Tiptap: `@tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder`
- [ ] Build `Journal.tsx`:
  - Left column: mini calendar + list of past entry dates
  - Right column: Tiptap editor (Lora font, clean, no toolbar by default — markdown shortcuts work)
  - Auto-saves entry to DB on change (debounce 1000ms)
  - Date header above editor
  - Word count shown below editor
- [ ] Wire to `journalStore` — `getOrCreateEntry(date)` on load
- [ ] "Today" always pre-selected in calendar

**Done when:** Can write a journal entry, navigate to past entries, and see word count.

---

## Phase 8 — Wiki

**Goal:** Knowledge base with page creation and markdown rendering.

- [ ] Build `Wiki.tsx` (list view):
  - Searchable list of wiki pages (title, last edited, tag chips)
  - "+ New Page" button → creates blank page with auto-focus on title
  - Sort: by date updated / alphabetical
- [ ] Build `WikiPage.tsx` (single page):
  - Tiptap editor for content (with markdown support)
  - `[[wikilink]]` rendered as blue links (custom Tiptap extension or post-render regex)
  - Clicking a wikilink navigates to that page (or creates it)
  - Auto-save + last edited timestamp
- [ ] Wire to `wikiStore`
- [ ] Page slugs generated from title on save

**Done when:** Can create a wiki page, write markdown, and link to other pages.

---

## Phase 9 — Protocol

**Goal:** Personal profile page displaying AI-curated entries.

- [ ] Build `Protocol.tsx`:
  - Header block: name, short bio (editable)
  - Sections: Skills / Goals / Decisions / Patterns / Open Questions / Milestones
  - Each section: list of `ProtocolEntry` items filtered by category
  - Each entry: date chip + content + source note link
  - "+ Add manually" per section
  - Toggle: "Show AI-generated only" / "Show all"
- [ ] Wire to `protocolStore`
- [ ] Empty state: "Your protocol will fill in as you use Cortex and process your inbox."

**Done when:** Can view Protocol sections, manually add entries, and they persist.

---

## Phase 10 — Daily Note

**Goal:** All-in-one today view working.

- [ ] Build `DailyNote.tsx`:
  - Section 1: Today's timetable strip (horizontal, shows blocks from `timetable` for today's weekday)
  - Section 2: Tasks due today (subset from `tasksStore`, filterable)
  - Section 3: Today's journal entry (same editor as Journal page, synced — same DB record)
  - Section 4: Habit checkboxes (from `settingsStore` habits, logged in `habitLogs`)
- [ ] Wire all four sections to their respective stores
- [ ] Make this the default landing page (or Dashboard — user can choose in Settings)

**Done when:** Opening Daily Note shows today's schedule, tasks, and journal correctly.

---

## Phase 11 — Dashboard

**Goal:** Command-centre overview screen.

- [ ] Build `Dashboard.tsx`:
  - Stat row: Inbox count / Tasks due today / Journal streak (days in a row)
  - Today's schedule strip (compact, same as Daily Note)
  - Recent inbox notes (last 5, truncated to 1 line each)
  - Protocol snapshot: 3 most recent entries
  - Quick capture input (same as Inbox input, saves to inbox)
- [ ] Wire to all stores
- [ ] All stat numbers link to their respective full pages

**Done when:** Dashboard shows live data from all sections.

---

## Phase 12 — AI Brain (Core AI Features)

**Goal:** All AI features working.

- [ ] Create `src/lib/ai.ts`:
  - `callMiniMax(messages, systemPrompt)` — base fetch wrapper to MiniMax API
  - MiniMax uses OpenAI-compatible format — easy to call with plain fetch
  - Reads API key from `settingsStore`
  - Streaming support via `ReadableStream` (MiniMax supports SSE streaming)
  - Error handling: no key, rate limit, network error

```typescript
// src/lib/ai.ts
const MINIMAX_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2'
const MODEL = 'MiniMax-Text-01'

export async function callMiniMax(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const apiKey = localStorage.getItem('cortex:apiKey')
  if (!apiKey) throw new Error('No MiniMax API key set')

  const res = await fetch(MINIMAX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: !!onChunk,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`)

  if (onChunk && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        try {
          const json = JSON.parse(line.slice(6))
          const chunk = json.choices?.[0]?.delta?.content ?? ''
          full += chunk
          onChunk(chunk)
        } catch {}
      }
    }
    return full
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
```

- [ ] Feature: **Process Inbox**
  - Button in Inbox + AI Brain page
  - Sends all `status: 'inbox'` notes to MiniMax with system prompt (see below)
  - MiniMax returns: list of wiki page updates + list of Protocol entries to add
  - App parses response → creates/updates wiki pages → adds protocol entries → marks notes as `processed`
  - Shows streaming log of what was done

- [ ] Feature: **Journal Prompt**
  - Button in Journal editor: "Suggest a prompt"
  - Sends: today's date + last 3 journal entries + recent protocol entries
  - MiniMax returns a reflection question
  - Inserts prompt as a blockquote above the editor

- [ ] Feature: **Brain Chat** (AI Brain page)
  - Chat interface in `AIBrain.tsx`
  - System prompt: includes recent notes, wiki pages, protocol, and today's tasks as context
  - Streaming responses via MiniMax SSE with typing cursor
  - "Process Inbox" shortcut button below input

- [ ] Log all AI calls to `aiLogs` table

**AI System Prompts (stored in `src/lib/ai.ts`):**

```
PROCESS INBOX PROMPT:
You are the user's personal knowledge manager. Here are their unprocessed inbox notes.
For each note:
1. Extract key concepts and create or update wiki pages (title + markdown content)
2. If the note contains anything personal (skill learned, decision made, goal set, pattern noticed), add a Protocol entry
Return ONLY a valid JSON object with shape: { "wikiUpdates": [{"slug": "", "title": "", "content": ""}], "protocolEntries": [{"category": "", "content": ""}] }
No explanation, no preamble. JSON only.

BRAIN CHAT PROMPT:
You are Cortex, the user's second brain. You have access to their recent notes, wiki, protocol, and tasks.
Answer questions conversationally. Be direct. Reference specific notes or wiki pages when relevant.
Context: [injected notes, wiki, protocol summary]
```

**Done when:** Can process inbox notes and see wiki pages + protocol entries created automatically.

---

## Phase 13 — UI Polish

**Goal:** Consistent, polished, complete UI across all pages.

- [ ] Loading states: spinner/skeleton on all async data fetches
- [ ] Consistent empty states on every section
- [ ] Toast notifications (success/error) for all mutations
- [ ] Keyboard shortcuts wired up (⌘N, ⌘J, ⌘K, ⌘P)
- [ ] Command palette (⌘K): search notes + navigate pages
- [ ] Sidebar badge counts (inbox unprocessed, tasks due today)
- [ ] Theme toggle (dark/light) working across all pages
- [ ] Responsive layout for smaller screens (sidebar collapses)
- [ ] All forms have validation and helpful error messages
- [ ] Smooth page transitions (opacity fade)

---

## Phase 14 — Testing & Edge Cases

**Goal:** Nothing breaks in normal use.

- [ ] Manual walkthrough of all 3 core user journeys (from App Flow doc)
- [ ] Test with empty database (first launch)
- [ ] Test with missing API key
- [ ] Test AI processing with 10+ inbox notes
- [ ] Test wiki wikilink creation and navigation
- [ ] Test timetable blocks across all 7 days
- [ ] Test journal entry creation for past dates
- [ ] Test tasks: create, complete, overdue highlighting
- [ ] Test Settings: change name, change theme, update API key
- [ ] Test "Clear all data" — confirm dialog, then full reset

---

## Phase 15 — Build & Distribution

**Goal:** Runnable as a local web app (and optionally desktop app).

- [ ] `npm run build` → `dist/` folder
- [ ] Verify `dist/index.html` opens correctly in browser (no server needed)
- [ ] Write `README.md`: setup instructions, how to get Anthropic API key, how to run
- [ ] Optional: wrap with Tauri for desktop `.app` / `.exe`
  - `cargo install tauri-cli`
  - `npm run tauri init`
  - `npm run tauri build`

---

## Done Criteria

The app is complete when:

- [ ] All 9 main sections are accessible and functional
- [ ] Quick capture works in under 3 seconds
- [ ] Processing inbox produces wiki pages and protocol entries
- [ ] Daily Note shows today's schedule, tasks, and journal together
- [ ] Protocol has entries after using the app for a few days
- [ ] Everything works offline except AI calls
- [ ] No data is stored anywhere except the user's own browser
