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
    id: record.id ? record.id.toString() : undefined,
  })

  return { error: error as Error | null }
}

export async function pullFromSupabase(): Promise<{ error: Error | null }> {
  const userId = await getUserId()
  if (!userId) {
    return { error: new Error('Not logged in') }
  }

  try {
    const [notes, journal, wiki, tasks, timetable, protocol, habitLogs, aiLogs] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('journal').select('*').eq('user_id', userId),
      supabase.from('wiki').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('timetable').select('*').eq('user_id', userId),
      supabase.from('protocol').select('*').eq('user_id', userId),
      supabase.from('habitLogs').select('*').eq('user_id', userId),
      supabase.from('aiLogs').select('*').eq('user_id', userId),
    ])

    if (notes.data) await db.notes.bulkPut(notes.data.map(normalizeNote))
    if (journal.data) await db.journal.bulkPut(journal.data.map(normalizeJournal))
    if (wiki.data) await db.wiki.bulkPut(wiki.data.map(normalizeWiki))
    if (tasks.data) await db.tasks.bulkPut(tasks.data.map(normalizeTask))
    if (timetable.data) await db.timetable.bulkPut(timetable.data)
    if (protocol.data) await db.protocol.bulkPut(protocol.data)
    if (habitLogs.data) await db.habitLogs.bulkPut(habitLogs.data)
    if (aiLogs.data) await db.aiLogs.bulkPut(aiLogs.data)

    return { error: null }
  } catch (e) {
    return { error: e as Error }
  }
}

function normalizeNote(note: any): Note {
  return {
    ...note,
    id: parseInt(note.id) || undefined,
    createdAt: new Date(note.created_at),
  }
}

function normalizeJournal(entry: any): JournalEntry {
  return {
    ...entry,
    id: parseInt(entry.id) || undefined,
    createdAt: new Date(entry.created_at),
    updatedAt: new Date(entry.updated_at || entry.created_at),
  }
}

function normalizeWiki(page: any): WikiPage {
  return {
    ...page,
    id: parseInt(page.id) || undefined,
    createdAt: new Date(page.created_at),
    updatedAt: new Date(page.updated_at),
  }
}

function normalizeTask(task: any): Task {
  return {
    ...task,
    id: parseInt(task.id) || undefined,
    createdAt: new Date(task.created_at),
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
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