import { create } from 'zustand'
import { db } from '../db/db'
import type { WikiPage } from '../types'
import { slugify } from '../lib/utils'

interface WikiState {
  items: WikiPage[]
  currentPage: WikiPage | null
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  getBySlug: (slug: string) => Promise<WikiPage | undefined>
  create: (title: string, content?: string) => Promise<number>
  update: (id: number, updates: Partial<WikiPage>) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useWikiStore = create<WikiState>((set, get) => ({
  items: [],
  currentPage: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const pages = await db.wiki.orderBy('updatedAt').reverse().toArray()
      set({ items: pages, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  getBySlug: async (slug: string) => {
    const page = await db.wiki.where('slug').equals(slug).first()
    if (page) {
      set({ currentPage: page })
    }
    return page
  },

  create: async (title, content = '') => {
    const slug = slugify(title)
    const now = new Date()
    const newPage: WikiPage = {
      slug,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      createdBy: 'user',
    }

    const existing = await db.wiki.where('slug').equals(slug).first()
    if (existing) {
      throw new Error('A page with this title already exists')
    }

    const id = await db.wiki.add(newPage)
    await get().fetchAll()
    return id
  },

  update: async (id, updates) => {
    await db.wiki.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    await get().fetchAll()
    const updated = await db.wiki.get(id)
    if (updated) {
      set({ currentPage: updated })
    }
  },

  delete: async (id) => {
    await db.wiki.delete(id)
    set({ currentPage: null })
    await get().fetchAll()
  },
}))