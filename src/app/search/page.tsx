'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, LogOut, Settings, Music } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/skeleton'
import { EmptyState } from '@/components/empty-state'

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
      setError('搜索失败，请重试')
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSongClick = (track: Track) => {
    sessionStorage.setItem('currentSong', JSON.stringify(track))
  }

  const handleTrendingSearch = (term: string) => {
    setQuery(term)
    const form = document.querySelector('form') as HTMLFormElement
    if (form) form.dispatchEvent(new Event('submit', { bubbles: true }))
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Navigation Bar - Design System style */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl nav-glow">
        <div className="flex justify-between items-center max-w-[1400px] mx-auto px-8 h-20">
          <div className="flex items-center gap-12">
            <a className="flex items-center gap-2 text-2xl font-extrabold text-white font-headline tracking-tight" href="/search">
              <span className="material-symbols-outlined text-[#72fe8f] text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
              LyricVocab
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a className="text-white border-b-2 border-[#72fe8f] pb-1 hover:scale-105 transition-transform duration-200" href="/search">搜索</a>
              <a className="text-[#adaaaa] hover:text-white transition-colors hover:scale-105 transition-transform duration-200" href="/vocabulary">词库</a>
              <a className="text-[#adaaaa] hover:text-white transition-colors hover:scale-105 transition-transform duration-200" href="/settings">个人中心</a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {!initializing && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/settings" className="text-[#adaaaa] hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                      <Settings className="w-4 h-4" />
                      {user.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-[#adaaaa] hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] px-6 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                    登录
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[700px] flex flex-col items-center justify-center px-6 overflow-hidden">
          {/* Background Aesthetic Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#72fe8f]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#006d42]/10 blur-[150px] rounded-full" />

          <div className="max-w-[1400px] w-full flex flex-col items-center text-center z-10">
            {/* Label */}
            <span className="font-label text-[#72fe8f] tracking-[0.2em] text-xs font-extrabold mb-6 block uppercase">原声学习环境</span>

            {/* Hero Heading */}
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-black hero-gradient-text tracking-tighter leading-[0.9] mb-12 max-w-4xl">
              通过音乐的旋律学习英语
            </h1>

            {/* Prominent Search Bar */}
            <div className="w-full max-w-2xl group relative mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#72fe8f]/20 to-[#88ebff]/20 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <form onSubmit={handleSearch} className="relative flex items-center bg-[#262626]/80 backdrop-blur-md rounded-full px-8 py-5 border border-[#484847]/10 shadow-2xl">
                <span className="material-symbols-outlined text-[#adaaaa] mr-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>search</span>
                <input
                  className="bg-transparent border-none focus:ring-0 w-full text-xl text-white placeholder:text-[#adaaaa]/50 font-label"
                  placeholder="搜索歌曲、艺人或歌词..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="bg-[#72fe8f] text-[#005f26] h-12 w-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all flex-shrink-0">
                  <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}>arrow_forward</span>
                </button>
              </form>
            </div>

            {/* Trending Search Tags */}
            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-[#adaaaa] font-label text-xs font-bold uppercase tracking-widest mr-2 self-center">热门搜索：</span>
              {['Taylor Swift', 'Coldplay', 'Ed Sheeran', 'The Weeknd', 'Billie Eilish'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingSearch(term)}
                  className="px-5 py-2 rounded-full bg-[#1a1a1a] border border-[#484847]/10 text-[#adaaaa] text-sm font-semibold hover:bg-[#2c2c2c] hover:text-[#72fe8f] hover:scale-105 transition-all duration-300"
                >
                  #{term}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-[1400px] mx-auto px-8 mb-4">
            <div className="bg-[#b92902]/10 border border-[#b92902]/20 text-[#ff7351] p-4 rounded-2xl text-center">
              {error}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && tracks.length === 0 && !error && (
          <div className="max-w-[1400px] mx-auto px-8 pb-16">
            <EmptyState
              icon="search_off"
              title="未找到相关歌曲"
              description="换个关键词试试，或者搜索其他艺人或歌曲名称"
            />
          </div>
        )}

        {/* Skeleton Loading */}
        {loading && (
          <section className="max-w-[1400px] mx-auto px-8 pb-16">
            <div className="h-8 w-40 bg-[#262626] rounded-xl mb-8 animate-shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-square rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {!loading && tracks.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-8 pb-16">
            <h2 className="font-headline text-2xl font-bold text-white mb-8 text-left">搜索结果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tracks.map((track) => (
                <Link
                  key={track.id}
                  href={`/song/${track.id}`}
                  onClick={() => handleSongClick(track)}
                >
                  <Card className="bg-[#1a1a1a] border-[#484847]/10 hover:bg-[#262626] hover:border-[#484847]/30 transition-all group cursor-pointer rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-square rounded-t-2xl overflow-hidden">
                        {track.image ? (
                          <img
                            src={track.image}
                            alt={track.album}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#262626]">
                            <Music className="w-12 h-12 text-[#484847]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>play_circle</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white truncate text-lg mb-1 group-hover:text-[#72fe8f] transition-colors">{track.name}</h3>
                        <p className="text-[#adaaaa] text-sm truncate mb-1">{track.artist}</p>
                        <p className="text-[#484847] text-xs truncate">{track.album}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick Links - when not searched */}
        {!searched && tracks.length === 0 && (
          <section className="max-w-[1400px] mx-auto px-8 pb-32">
            {/* Featured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {/* Large Feature Card */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-2xl aspect-[16/9] md:aspect-auto bg-[#1a1a1a]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#72fe8f]/20 via-transparent to-[#88ebff]/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-[#72fe8f] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-[#005f26]">精选</span>
                  </div>
                  <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-white mb-4">跟随 Adele 掌握词汇</h2>
                  <p className="text-[#adaaaa] max-w-md mb-6">探索《25》中丰富的隐喻和情感深度，扩展您的高级英语词汇。</p>
                  <button onClick={() => handleTrendingSearch('Adele')} className="flex items-center gap-2 font-bold text-[#72fe8f] group-hover:translate-x-2 transition-transform">
                    开始学习 <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
              </div>

              {/* Secondary Cards Stack */}
              <div className="flex flex-col gap-6">
                <div className="bg-[#1a1a1a] p-8 rounded-2xl flex flex-col justify-between h-full hover:bg-[#262626] transition-colors group">
                  <div>
                    <span className="material-symbols-outlined text-[#72fe8f] text-4xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>auto_awesome</span>
                    <h3 className="font-headline text-xl font-bold text-white mb-2">智能歌词 AI</h3>
                    <p className="text-[#adaaaa] text-sm leading-relaxed">即时翻译并解析最新热门金曲中的成语和俚语。</p>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <span className="material-symbols-outlined text-[#adaaaa] group-hover:text-white transition-colors">north_east</span>
                  </div>
                </div>
                <div className="bg-[#72fe8f]/5 border border-[#72fe8f]/10 p-8 rounded-2xl flex flex-col justify-between h-full hover:bg-[#72fe8f]/10 transition-colors group">
                  <div>
                    <span className="material-symbols-outlined text-[#72fe8f] text-4xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>speed</span>
                    <h3 className="font-headline text-xl font-bold text-white mb-2">每日韵律挑战</h3>
                    <p className="text-[#adaaaa] text-sm leading-relaxed">加入 4,200 名学习者，参与今日快节奏的词汇节拍匹配。</p>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <span className="material-symbols-outlined text-[#72fe8f] group-hover:scale-125 transition-transform cursor-pointer">play_circle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vocabulary Lists Grid */}
            <div className="mb-8">
              <h3 className="font-headline text-2xl font-bold text-white mb-8">最新词汇表</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[
                  { name: '合成器流行英语', count: '24 个新短语', color: 'from-pink-500/20 to-lime-500/20' },
                  { name: '典雅爵士词汇', count: '18 个高级习语', color: 'from-gray-500/20 to-purple-500/20' },
                  { name: '街头俚语 101', count: '42 个常用词汇', color: 'from-blue-500/20 to-green-500/20' },
                  { name: '民谣与叙事', count: '30 组隐喻表达', color: 'from-amber-500/20 to-orange-500/20' },
                  { name: '古典诗词', count: '15 个罕见形容词', color: 'from-rose-500/20 to-pink-500/20' },
                ].map((item, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className={`relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-xl bg-gradient-to-br ${item.color} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-white/50 text-5xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                        {['album', 'queue_music', 'graphic_eq', 'waves', 'music_note'][idx]}
                      </span>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>play_circle</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                    <p className="text-[#adaaaa] text-xs">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] border-t border-[#262626] py-20 px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <a className="flex items-center gap-2 text-2xl font-extrabold text-white font-headline tracking-tight mb-6" href="/search">
              <span className="material-symbols-outlined text-[#72fe8f] text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
              LyricVocab
            </a>
            <p className="text-[#adaaaa] text-sm leading-relaxed max-w-xs">
              通过声音沉浸和歌词分析的力量，构建语言学习的未来。
            </p>
          </div>
          <div>
            <h5 className="font-headline font-bold mb-6 text-white">平台</h5>
            <ul className="space-y-4 text-sm text-[#adaaaa]">
              <li><a className="hover:text-[#72fe8f] transition-colors" href="/search">浏览艺人</a></li>
              <li><a className="hover:text-[#72fe8f] transition-colors" href="/vocabulary">词汇卡片</a></li>
              <li><a className="hover:text-[#72fe8f] transition-colors" href="/settings">学习设置</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-headline font-bold mb-6 text-white">关于</h5>
            <ul className="space-y-4 text-sm text-[#adaaaa]">
              <li><a className="hover:text-[#72fe8f] transition-colors" href="#">关于我们</a></li>
              <li><a className="hover:text-[#72fe8f] transition-colors" href="#">联系我们</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-headline font-bold mb-6 text-white">加入社区</h5>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#adaaaa] hover:text-[#72fe8f] hover:bg-[#262626] transition-all">
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}