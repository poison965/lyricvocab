'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Music, User, BookOpen, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setInitializing(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/search')
    router.refresh()
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setTracks([])
      } else {
        setTracks(data.tracks || [])
      }
    } catch (err) {
      setError('搜索失败，请稍后重试')
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSongClick = (track: Track) => {
    sessionStorage.setItem('currentSong', JSON.stringify(track))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Music className="w-6 h-6" />
            LyricVocab
          </h1>
          <nav className="flex items-center gap-4">
            <Link href="/search" className="text-gray-600 hover:text-blue-600">
              搜索
            </Link>
            <Link href="/vocabulary" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              单词本
            </Link>
            {!initializing && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/settings" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      {user.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      退出
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    登录
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            用喜欢的歌曲背单词
          </h2>
          <p className="text-gray-600 text-lg">
            搜索英文歌曲，从歌词中提取符合考纲的单词
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            type="text"
            placeholder="搜索歌曲或歌手..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 text-lg"
          />
          <Button type="submit" size="lg" disabled={loading} className="px-8">
            {loading ? '搜索中...' : (
              <>
                <Search className="w-5 h-5 mr-2" />
                搜索
              </>
            )}
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && tracks.length === 0 && !error && (
          <div className="text-center text-gray-500 py-8">
            未找到相关歌曲，请尝试其他关键词
          </div>
        )}

        {tracks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/song/${track.id}`}
                onClick={() => handleSongClick(track)}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {track.image ? (
                        <img
                          src={track.image}
                          alt={track.album}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <Music className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {track.name}
                      </h3>
                      <p className="text-gray-600 text-sm truncate">
                        {track.artist}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {track.album}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}