import Dexie, { Table } from 'dexie'
import type {
  Note,
  JournalEntry,
  WikiPage,
  Task,
  TimetableBlock,
  ProtocolEntry,
  HabitLog,
  AILog,
} from '../types'

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
      notes: '++id, createdAt, status, *tags',
      journal: '++id, date',
      wiki: '++id, slug, updatedAt, *tags',
      tasks: '++id, dueDate, status, priority, *tags',
      timetable: '++id, dayOfWeek, startTime',
      protocol: '++id, category, createdAt',
      habitLogs: '++id, date, habitId',
      aiLogs: '++id, createdAt, type',
    })
  }
}

export const db = new CortexDB()