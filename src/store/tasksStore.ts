import { create } from 'zustand'
import { db } from '../db/db'
import type { Task } from '../types'

interface TasksState {
  items: Task[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (task: Omit<Task, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<Task>) => Promise<void>
  delete: (id: number) => Promise<void>
  toggleComplete: (id: number) => Promise<void>
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksDueToday: () => Task[]
  getUpcomingTasks: () => Task[]
}

export const useTasksStore = create<TasksState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await db.tasks.orderBy('dueDate').toArray()
      set({ items: tasks, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  add: async (task) => {
    const id = await db.tasks.add(task as Task)
    await get().fetchAll()
    return id
  },

  update: async (id, updates) => {
    await db.tasks.update(id, updates)
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.tasks.delete(id)
    await get().fetchAll()
  },

  toggleComplete: async (id) => {
    const task = get().items.find(t => t.id === id)
    if (!task) return

    const newStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done'
    const updates: Partial<Task> = {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date() : undefined,
    }

    await db.tasks.update(id, updates)
    await get().fetchAll()
  },

  getTasksByStatus: (status) => {
    return get().items.filter(t => t.status === status)
  },

  getTasksDueToday: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().items.filter(t => t.dueDate === today && t.status !== 'done')
  },

  getUpcomingTasks: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().items.filter(t => t.dueDate && t.dueDate > today && t.status !== 'done')
  },
}))