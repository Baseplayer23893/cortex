# 04 — UI/UX Design Brief

---

## Aesthetic Direction

**Dark-mode first. Dense but calm. Like if Notion and Linear had a baby that went to college.**

The vibe is a serious tool that doesn't take itself too seriously. It should feel like a well-worn notebook — functional, personal, slightly textured. Not corporate. Not minimal to the point of sterile. Smart density: lots of info visible at once, but never cluttered.

Reference apps: **Linear** (sidebar + density), **Obsidian** (wiki feel), **Raycast** (speed, keyboard-first), **Bear** (warm writing experience), **Cron** (clean calendar).

---

## Color Palette

### Dark Mode (Primary)

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0e0e10` | App background |
| `--bg-surface` | `#18181b` | Cards, sidebar, panels |
| `--bg-elevated` | `#222226` | Inputs, hover states, code blocks |
| `--bg-overlay` | `#2a2a2f` | Popovers, tooltips |
| `--border` | `#2e2e33` | All borders |
| `--border-hover` | `#3f3f46` | Hover borders |
| `--text-primary` | `#f4f4f5` | Main text |
| `--text-secondary` | `#a1a1aa` | Muted labels, timestamps |
| `--text-tertiary` | `#71717a` | Placeholders, disabled |
| `--accent` | `#7c3aed` | Violet — primary actions, links, active states |
| `--accent-soft` | `#7c3aed1a` | Soft violet backgrounds |
| `--green` | `#22c55e` | Done / success / streaks |
| `--amber` | `#f59e0b` | Warning / due soon |
| `--red` | `#ef4444` | Overdue / delete |
| `--blue` | `#3b82f6` | Info / wiki links |

### Light Mode (Optional toggle)

| Token | Value |
|---|---|
| `--bg-base` | `#fafafa` |
| `--bg-surface` | `#ffffff` |
| `--bg-elevated` | `#f4f4f5` |
| `--text-primary` | `#09090b` |
| `--text-secondary` | `#52525b` |
| `--border` | `#e4e4e7` |
| `--accent` | `#7c3aed` |

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| UI / Body | `'Geist'` or `'DM Sans'` | 14px | 400 |
| Headings | Same | 16–20px | 500–600 |
| Journal / Wiki Editor | `'Lora'` or `'Fraunces'` (serif) | 16px | 400 |
| Code / Monospace | `'Geist Mono'` | 13px | 400 |
| Timestamps / Meta | UI font | 12px | 400, muted |

Load via Google Fonts or Fontsource (local npm install for offline use).

---

## Component Style

| Property | Value |
|---|---|
| Border radius | `6px` default, `10px` for cards, `4px` for badges |
| Borders | `1px solid var(--border)` — always visible, never invisible |
| Shadows | None in dark mode. `0 1px 3px rgba(0,0,0,0.1)` subtle in light mode |
| Buttons (primary) | Solid violet bg, white text, `6px` radius |
| Buttons (secondary) | Transparent bg, border, text = secondary |
| Buttons (ghost) | No border, hover bg = elevated |
| Inputs | `--bg-elevated` bg, `--border` border, focused = `--accent` ring |
| Cards | `--bg-surface` bg, `--border` border, `10px` radius, `16px` padding |
| Active sidebar item | Accent-soft bg + accent text + left border accent stripe |
| Badges / tags | Pill shape, colored bg variants, `12px` text |

---

## Layout

```
┌──────────────┬──────────────────────────────────────┐
│              │  Top Bar (section title + actions)   │
│   Sidebar    ├──────────────────────────────────────┤
│   220px      │                                      │
│              │       Main Content Area              │
│  - Nav items │       (changes per section)          │
│              │                                      │
│  [Settings]  │                                      │
│  [Username]  │                                      │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar: fixed left, always visible
- No top-level navbar
- Content area: full remaining width
- Max content width: `900px` centered for journal/wiki editor. Full width for dashboard/timetable.

---

## Section-specific UI Patterns

### Dashboard
- 3-column stat row at top (inbox count, tasks due today, journal streak)
- "Today" schedule strip (horizontal timeline of timetable blocks)
- Recent inbox notes (last 5, truncated)
- Protocol snapshot (3 latest entries)

### Inbox
- Large text input at top with placeholder "Capture a thought..."
- Notes list below — each note shows: timestamp, first 2 lines, tag chips
- Bulk "Process with AI" button — violet, full width, fixed at bottom

### Journal
- Left column: mini calendar + list of entries by date
- Right column: full-page Lora serif editor. Clean. No distractions.
- AI prompt button: "💡 Suggest a prompt" — calls API for a reflection question

### Wiki
- Left: searchable list of pages with last-edited date
- Right: full markdown editor with live preview toggle
- Wikilinks render as blue underlined text `[[Page Name]]`

### Protocol
- YAML-style display at top (rendered as readable key-value blocks, not raw YAML)
- Timeline below: chronological cards, newest first, each with date + source note link
- Edit mode: toggle to raw edit any section

### Tasks
- Grouped by: Today / This Week / Later / Done
- Each task: checkbox + title + due date chip + priority dot + tag
- Inline add: click "+ Add task" at bottom of any group

### Timetable
- Standard 7-day grid, 7am–10pm visible by default
- Time blocks are colored rectangles (draggable in v2)
- Click empty slot → quick add form

### Daily Note
- Split into 3 sections stacked vertically:
  1. Schedule strip (today's timetable blocks)
  2. Tasks (due today)
  3. Journal entry (editor, full width)

### AI Brain
- Chat interface, messages on right (user) and left (AI)
- Below input: "Process Inbox" shortcut button
- Above chat: collapsible "Last processing log" accordion

---

## Animations / Motion

- Sidebar transitions: `200ms ease` on active state change
- Page transitions: simple `opacity 150ms` fade
- Task completion: strike-through animation + green flash
- AI streaming: typing cursor effect on AI messages
- No heavy animations — this is a productivity app, not a portfolio

---

## Accessibility

- Minimum contrast ratio 4.5:1 for all text
- All interactive elements keyboard-navigable
- Focus rings visible (violet glow)
- Labels on all form inputs
- Timestamps use `<time>` elements with datetime attribute

---

## Dark / Light Toggle

- Toggle in Settings and also accessible via sidebar footer icon
- Persisted to localStorage
- Dark mode is the default and primary experience
