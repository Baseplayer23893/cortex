# Cortex — Project Planning Docs

> Your entire life, one local app. Think, capture, grow.

---

These are the 6 planning documents for **Cortex** — a fully local second brain / life + study app for college students. Use these as the source of truth when building with any AI coding agent.

## Documents

| # | File | Purpose |
|---|---|---|
| 01 | `01-PRD.md` | What we're building and for whom |
| 02 | `02-TRD.md` | Tech stack — React + Vite + Dexie + Anthropic API |
| 03 | `03-AppFlow.md` | Every page, every click, every journey |
| 04 | `04-UIUXBrief.md` | Dark mode, violet accent, Geist + Lora fonts |
| 05 | `05-Schema.md` | IndexedDB tables (notes, journal, wiki, tasks, timetable, protocol) |
| 06 | `06-ImplementationPlan.md` | 15 phases, in order, with done criteria |

## How to use

Paste all 6 documents at the start of your Claude Code / Cursor session and say:

> "Here are my project planning docs. Use these as the source of truth for everything you build. Start with Phase 1 of the implementation plan."

## Core concept

```
Capture (Inbox) → AI Processing → Wiki + Protocol
                                        ↓
                              Growing picture of who you are
```

The Protocol is the heartbeat — it auto-updates with every AI processing run, building a living profile of your skills, goals, decisions, and patterns over time.
