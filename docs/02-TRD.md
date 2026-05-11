# 02 — TRD: Technical Requirements Document

---

## Frontend

| Layer | Choice |
|---|---|
| Framework | **React 18** with **TypeScript** |
| Build Tool | **Vite** |
| Styling | **Tailwind CSS v3** + **shadcn/ui** components |
| Icons | **Lucide React** |
| Routing | **React Router v6** (hash routing for local file usage) |
| State Management | **Zustand** (global store for notes, tasks, protocol, settings) |
| Editor | **CodeMirror 6** or **Tiptap** (rich markdown editor for journal + wiki) |
| Date/Time | **date-fns** |
| Markdown Rendering | **react-markdown** + **remark-gfm** |

---

## Backend / Server

**None.** This is a fully local, frontend-only app.

All data lives in the browser via **IndexedDB** (through **Dexie.js**). No server needed. No backend. No deploy.

---

## Database / Storage

| Storage | Purpose |
|---|---|
| **Dexie.js (IndexedDB)** | All structured data — notes, tasks, journal entries, wiki pages, protocol, timetable |
| **localStorage** | App settings (theme, API key, user name) |

### Why IndexedDB over localStorage?
- Can store thousands of notes without hitting limits
- Supports querying, indexing, and relationships
- Async — won't block the UI

---

## Authentication
**None.** Single-user, local-only app. No login required.

The user sets their name and API key in Settings on first launch. That's it.

---

## LLM / AI

| | |
|---|---|
| Provider | **MiniMax** |
| Model | `MiniMax-Text-01` (or `abab6.5s-chat`) — free tier available |
| API Style | OpenAI-compatible REST API |
| Base URL | `https://api.minimax.chat/v1/text/chatcompletion_v2` |
| Integration | Direct API calls from the frontend using the user's own MiniMax API key (stored in localStorage) |
| Use cases | Process inbox → wiki, update Protocol, journal prompts, ask-your-brain Q&A |

**Note:** The API key is stored only in localStorage. It never leaves the user's device except in headers sent directly to MiniMax's API.

**Getting a free MiniMax API key:** Sign up at [minimaxi.com](https://www.minimaxi.com) → API Keys → Create key. Free tier includes generous monthly token allowance.

---

## Key Libraries

```
react                     # UI framework
react-router-dom          # routing
zustand                   # state management
dexie                     # IndexedDB wrapper
tailwindcss               # styling
@shadcn/ui                # component library
lucide-react              # icons
date-fns                  # date utilities
react-markdown            # markdown rendering
remark-gfm                # github-flavored markdown
@tiptap/react             # rich text / markdown editor
@tiptap/starter-kit       # tiptap core extensions
```

---

## Folder Structure

```
cortex/
├── public/
├── src/
│   ├── components/        # reusable UI components
│   │   ├── ui/            # shadcn base components (button, card, input, etc.)
│   │   ├── layout/        # Sidebar, TopBar, Layout wrapper
│   │   └── shared/        # NoteCard, TaskItem, MarkdownEditor, etc.
│   ├── pages/             # one file per route/section
│   │   ├── Dashboard.tsx
│   │   ├── Inbox.tsx
│   │   ├── Journal.tsx
│   │   ├── Wiki.tsx
│   │   ├── Protocol.tsx
│   │   ├── Tasks.tsx
│   │   ├── Timetable.tsx
│   │   ├── DailyNote.tsx
│   │   ├── AIBrain.tsx
│   │   └── Settings.tsx
│   ├── store/             # Zustand stores
│   │   ├── notesStore.ts
│   │   ├── tasksStore.ts
│   │   ├── journalStore.ts
│   │   ├── wikiStore.ts
│   │   ├── protocolStore.ts
│   │   ├── timetableStore.ts
│   │   └── settingsStore.ts
│   ├── db/
│   │   └── db.ts          # Dexie database schema + instance
│   ├── lib/
│   │   ├── ai.ts          # Anthropic API call helpers
│   │   ├── protocol.ts    # Protocol update logic
│   │   └── utils.ts       # shared helpers
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example           # VITE_APP_NAME=Cortex (no secrets here)
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Environment Variables

```
# .env.local — user fills this in, or set via Settings UI
VITE_APP_NAME=Cortex
```

The MiniMax API key is **not** stored in `.env`. It's entered by the user in the Settings page and saved to `localStorage` at runtime.

---

## Hosting / Distribution

| Option | How |
|---|---|
| **Local dev** | `npm run dev` → `localhost:5173` |
| **Local build** | `npm run build` → open `dist/index.html` in browser |
| **Desktop app (optional v2)** | Wrap with **Tauri** for a real desktop .exe / .app |

---

## Hard Constraints

- No backend server — everything runs in the browser
- No external storage — no S3, no Supabase, no Firebase
- Only external network call allowed: MiniMax API (when user triggers AI features)
- Must work fully offline except for AI features
- API key never logged, never sent anywhere except directly to `api.minimax.chat`
- Use MiniMax free tier — keep prompts efficient, avoid unnecessary calls
