import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { word, translation, songName, artist, lyricContext, songId } = body

    if (!word || !songName || !artist || !lyricContext) {
      return NextResponse.json({ error: 'Missing required fields', status: 400 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            )
          },
        },
      }
    )

    // Try to get user from cookie first
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 })
    }

    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: user.id,
        word,
        translation: translation || null,
        song_name: songName,
        artist,
        lyric_context: lyricContext,
        song_id: songId || null,
        status: 'learning',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '单词已存在', status: 409 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message, status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error saving word:', error)
    return NextResponse.json({ error: 'Failed to save word', status: 500 })
  }
}