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

**Supabase** — handles auth, cloud database, and real-time sync.

| Layer | Choice |
|---|---|
| Backend | **Supabase** (Auth + PostgreSQL + Realtime) |
| Local cache | **Dexie.js** (IndexedDB) — offline-first, instant UI |
| Sync strategy | Local-first: write to Dexie → sync to Supabase in background |

---

## Database / Storage

| Storage | Purpose |
|---|---|
| **Dexie.js (IndexedDB)** | Local cache — all data lives here first, works fully offline |
| **Supabase (PostgreSQL)** | Cloud sync — mirrors local data when online, enables cross-device |
| **localStorage** | App settings (theme, API key, user name, sync preferences) |

### Hybrid local-first strategy
1. All writes go to Dexie first → UI updates instantly
2. If user is logged in + online → write also syncs to Supabase in background
3. On new device login → pull all data from Supabase into local Dexie
4. Offline → works fully on Dexie alone, queues sync for when back online

---

## Authentication

| | |
|---|---|
| Provider | **Supabase Auth** |
| Methods | Google OAuth + Magic Link (email, no password) |
| Session | JWT stored by Supabase client, auto-refreshed |
| Optional | Auth is optional — app works locally without login. Login enables sync. |

Flow:
- First launch → onboarding → option to "Use locally" OR "Sign in to sync"
- Signed in users get cross-device sync automatically
- Signed out users get local-only mode (all features still work)

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
- Must work fully offline (Dexie handles this)
- Supabase sync runs in background — never blocks UI
- MiniMax API key stored in localStorage only, sent only to `api.minimax.chat`
- Use MiniMax free tier — keep prompts efficient, avoid unnecessary calls
- Supabase free tier: 500MB DB, 50MB file storage, 50k MAU — more than enough
