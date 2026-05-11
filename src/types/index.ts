export interface Note {
  id?: number
  content: string
  createdAt: Date
  status: 'inbox' | 'processed' | 'archived'
  tags?: string[]
  wikiLinks?: string[]
  relatedWikiSlug?: string  // if linked to a wiki page
  aiProcessedAt?: Date
}

export interface JournalEntry {
  id?: number
  date: string
  content: string
  wordCount: number
  related?: string[]  // slugs of related wiki pages
  createdAt: Date
  updatedAt: Date
  aiPromptUsed?: string
}

export interface WikiPage {
  id?: number
  slug: string
  title: string
  content: string
  tags?: string[]
  related?: string[]  // slugs of related wiki pages
  createdAt: Date
  updatedAt: Date
  createdBy: 'user' | 'ai'
  sourceNoteIds?: number[]
}

export interface Task {
  id?: number
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  tags?: string[]
  createdAt: Date
  completedAt?: Date
  sourceNoteId?: number
}

export interface TimetableBlock {
  id?: number
  title: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string
  endTime: string
  color?: string
  location?: string
  recurring: boolean
  notes?: string
}

export interface ProtocolEntry {
  id?: number
  category: 'skill' | 'goal' | 'decision' | 'pattern' | 'question' | 'milestone'
  content: string
  createdAt: Date
  sourceNoteId?: number
  aiGenerated: boolean
}

export interface HabitLog {
  id?: number
  habitId: string
  date: string
  completed: boolean
  note?: string
}

export interface AILog {
  id?: number
  type: 'process-inbox' | 'journal-prompt' | 'brain-chat' | 'protocol-update'
  createdAt: Date
  input: string
  output: string
  noteIdsProcessed?: number[]
  tokensUsed?: number
}

export interface Habit {
  id: string
  name: string
  icon: string
}

export interface Settings {
  userName: string
  theme: 'dark' | 'light'
  apiKey: string
  apiBaseUrl: string
  aiModel: string
  habits: Habit[]
  onboarded: boolean
}