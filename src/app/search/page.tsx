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
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if user completed onboarding, if not redirect
      const userLevel = localStorage.getItem('user_vocabulary_level')
      setUser(session?.user ?? null)
      setInitializing(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
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
      setError('Search failed, please try again')
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSongClick = (track: Track) => {
    sessionStorage.setItem('currentSong', JSON.stringify(track))
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header - Spotify style */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-2 group">
            <Music className="w-6 h-6 text-[#1DB954] group-hover:text-[#1ed760] transition-colors" />
            <span className="text-xl font-bold text-white">LyricVocab</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/search" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              搜索
            </Link>
            <Link href="/vocabulary" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
              <BookOpen className="w-4 h-4" />
              生词本
            </Link>
            {!initializing && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/settings" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                      <Settings className="w-4 h-4" />
                      {user.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
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
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            通过喜欢的歌曲学习词汇
          </h2>
          <p className="text-gray-400 text-lg">
            搜索英文歌曲，从歌词中提取考试相关词汇
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            type="text"
            placeholder="搜索歌曲或艺术家..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 text-lg bg-[#181818] border-white/10 text-white placeholder:text-gray-500 focus:border-[#1DB954] focus:ring-[#1DB954]"
          />
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="px-8 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
          >
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && tracks.length === 0 && !error && (
          <div className="text-center text-gray-500 py-8">
            未找到歌曲，请尝试其他关键词
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
                <Card className="bg-[#181818] border-white/10 hover:bg-[#282828] hover:border-white/20 transition-all group cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#282828] rounded-md overflow-hidden flex-shrink-0 relative">
                      {track.image ? (
                        <img
                          src={track.image}
                          alt={track.album}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#1DB954] transition-colors">
                        {track.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {track.artist}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {track.album}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Links */}
        {!searched && tracks.length === 0 && (
          <div className="mt-12">
            <h3 className="text-white font-semibold mb-4">热门搜索</h3>
            <div className="flex flex-wrap gap-2">
              {['Taylor Swift', 'Ed Sheeran', 'Billie Eilish', 'The Weeknd', 'Coldplay'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term)
                    // Trigger search
                    const form = document.querySelector('form')
                    if (form) form.dispatchEvent(new Event('submit', { bubbles: true }))
                  }}
                  className="px-4 py-2 bg-[#181818] border border-white/10 rounded-full text-gray-300 hover:bg-[#282828] hover:border-white/20 transition-all text-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}