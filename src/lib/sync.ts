import { supabase } from './supabase'
import { db } from '../db/db'
import type { Note, JournalEntry, WikiPage, Task, TimetableBlock, ProtocolEntry, HabitLog, AILog } from '../types'

type DbTable = 'notes' | 'journal' | 'wiki' | 'tasks' | 'timetable' | 'protocol' | 'habitLogs' | 'aiLogs'

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function syncToSupabase<T extends DbTable>(
  table: T,
  record: any
): Promise<{ error: Error | null }> {
  const userId = await getUserId()
  if (!userId) {
    return { error: new Error('Not logged in') }
  }

  const { error } = await supabase.from(table).upsert({
    ...record,
    user_id: userId,
  })

  return { error: error as Error | null }
}

export async function pullFromSupabase(): Promise<{ error: Error | null }> {
  const userId = await getUserId()
  if (!userId) {
    return { error: new Error('Not logged in') }
  }

  const errors: string[] = []

  try {
    const [notesRes, journalRes, wikiRes, tasksRes, timetableRes, protocolRes, habitLogsRes, aiLogsRes] = await Promise.allSettled([
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('journal').select('*').eq('user_id', userId),
      supabase.from('wiki').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('timetable').select('*').eq('user_id', userId),
      supabase.from('protocol').select('*').eq('user_id', userId),
      supabase.from('habitLogs').select('*').eq('user_id', userId),
      supabase.from('aiLogs').select('*').eq('user_id', userId),
    ])

    if (notesRes.status === 'fulfilled' && notesRes.value.data) {
      await db.notes.bulkPut(notesRes.value.data.map(normalizeNote))
    } else if (notesRes.status === 'rejected') {
      errors.push(`notes: ${notesRes.reason}`)
    }

    if (journalRes.status === 'fulfilled' && journalRes.value.data) {
      await db.journal.bulkPut(journalRes.value.data.map(normalizeJournal))
    } else if (journalRes.status === 'rejected') {
      errors.push(`journal: ${journalRes.reason}`)
    }

    if (wikiRes.status === 'fulfilled' && wikiRes.value.data) {
      await db.wiki.bulkPut(wikiRes.value.data.map(normalizeWiki))
    } else if (wikiRes.status === 'rejected') {
      errors.push(`wiki: ${wikiRes.reason}`)
    }

    if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
      await db.tasks.bulkPut(tasksRes.value.data.map(normalizeTask))
    } else if (tasksRes.status === 'rejected') {
      errors.push(`tasks: ${tasksRes.reason}`)
    }

    if (timetableRes.status === 'fulfilled' && timetableRes.value.data) {
      await db.timetable.bulkPut(timetableRes.value.data.map(normalizeTimetable))
    } else if (timetableRes.status === 'rejected') {
      errors.push(`timetable: ${timetableRes.reason}`)
    }

    if (protocolRes.status === 'fulfilled' && protocolRes.value.data) {
      await db.protocol.bulkPut(protocolRes.value.data.map(normalizeProtocol))
    } else if (protocolRes.status === 'rejected') {
      errors.push(`protocol: ${protocolRes.reason}`)
    }

    if (habitLogsRes.status === 'fulfilled' && habitLogsRes.value.data) {
      await db.habitLogs.bulkPut(habitLogsRes.value.data.map(normalizeHabitLog))
    } else if (habitLogsRes.status === 'rejected') {
      errors.push(`habitLogs: ${habitLogsRes.reason}`)
    }

    if (aiLogsRes.status === 'fulfilled' && aiLogsRes.value.data) {
      await db.aiLogs.bulkPut(aiLogsRes.value.data.map(normalizeAILog))
    } else if (aiLogsRes.status === 'rejected') {
      errors.push(`aiLogs: ${aiLogsRes.reason}`)
    }

    if (errors.length > 0) {
      console.warn('Partial sync failures:', errors)
    }

    return { error: errors.length > 0 ? new Error(`Sync partially failed: ${errors.join(', ')}`) : null }
  } catch (e) {
    return { error: e as Error }
  }
}

function normalizeNote(note: any): Note {
  return {
    ...note,
    id: note.local_id || crypto.randomUUID(),
    createdAt: new Date(note.created_at),
  }
}

function normalizeJournal(entry: any): JournalEntry {
  return {
    ...entry,
    id: entry.local_id || crypto.randomUUID(),
    createdAt: new Date(entry.created_at),
    updatedAt: new Date(entry.updated_at || entry.created_at),
  }
}

function normalizeWiki(page: any): WikiPage {
  return {
    ...page,
    id: page.local_id || crypto.randomUUID(),
    createdAt: new Date(page.created_at),
    updatedAt: new Date(page.updated_at),
  }
}

function normalizeTask(task: any): Task {
  return {
    ...task,
    id: task.local_id || crypto.randomUUID(),
    createdAt: new Date(task.created_at),
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
  }
}

function normalizeTimetable(block: any): TimetableBlock {
  return {
    ...block,
    id: block.local_id || crypto.randomUUID(),
  }
}

function normalizeProtocol(entry: any): ProtocolEntry {
  return {
    ...entry,
    id: entry.local_id || crypto.randomUUID(),
    createdAt: new Date(entry.created_at),
  }
}

function normalizeHabitLog(log: any): HabitLog {
  return {
    ...log,
    id: log.local_id || crypto.randomUUID(),
    date: new Date(log.date),
  }
}

function normalizeAILog(log: any): AILog {
  return {
    ...log,
    id: log.local_id || crypto.randomUUID(),
    createdAt: new Date(log.created_at),
  }
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local-only'

export async function checkSyncStatus(): Promise<SyncStatus> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return 'local-only'
  }

  if (!navigator.onLine) {
    return 'offline'
  }

  return 'synced'
}