import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client - will work with placeholder values for build
// Real values will be used at runtime if configured
export const supabase: SupabaseClient<any> = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder')

export type Database = {
  public: {
    Tables: {
      user_vocabulary: {
        Row: {
          id: string
          user_id: string
          word: string
          translation: string | null
          song_name: string
          artist: string
          lyric_context: string
          song_id: string | null
          status: 'learning' | 'mastered'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          translation?: string | null
          song_name: string
          artist: string
          lyric_context: string
          song_id?: string | null
          status?: 'learning' | 'mastered'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          translation?: string | null
          song_name?: string
          artist?: string
          lyric_context?: string
          song_id?: string | null
          status?: 'learning' | 'mastered'
          created_at?: string
        }
      }
    }
  }
}