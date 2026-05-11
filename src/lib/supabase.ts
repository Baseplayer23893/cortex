import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

export type User = {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export type Session = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  user: User
}