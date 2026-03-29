'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Trash2, BookOpen, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface VocabWord {
  id: string
  word: string
  translation: string | null
  song_name: string
  artist: string
  lyric_context: string
  status: 'learning' | 'mastered'
  created_at: string
}

export default function VocabularyPage() {
  const router = useRouter()
  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)
  const { speak } = useSpeechSynthesis()
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUser()

    // Listen for auth changes to keep session in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user)
      setInitializing(false)
      if (session?.user) {
        fetchWords(session.user.id)
      } else {
        setWords([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user)
    setInitializing(false)

    if (session?.user) {
      fetchWords(session.user.id)
    } else {
      setLoading(false)
    }
  }

  const fetchWords = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching words:', error)
        // If RLS blocks, try without filter for demo
        if (error.message.includes('row-level security')) {
          setWords([])
        }
      } else {
        setWords(data || [])
      }
    } catch (error) {
      console.error('Error fetching words:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const deleteWord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .delete()
        .eq('id', id)

      if (!error) {
        setWords(words.filter(w => w.id !== id))
      }
    } catch (error) {
      console.error('Error deleting word:', error)
    }
  }

  const toggleCard = (id: string) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(id)) {
      newFlipped.delete(id)
    } else {
      newFlipped.add(id)
    }
    setFlippedCards(newFlipped)
  }

  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#72fe8f] mx-auto mb-4" />
          <p className="text-[#adaaaa]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardContent className="p-8 text-center">
            <span className="material-symbols-outlined w-16 h-16 mx-auto mb-4 text-[#72fe8f] block" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>auto_stories</span>
            <h2 className="font-headline text-xl font-bold text-white mb-2">请先登录</h2>
            <p className="text-[#adaaaa] mb-6">登录后查看您的个人生词本</p>
            <Link href="/login">
              <Button className="w-full bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full">
                去登录
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-xl nav-glow sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-[#adaaaa] hover:text-white transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu_book</span>
              我的生词本
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#adaaaa] text-sm">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#adaaaa] hover:text-white rounded-xl">
              <span className="material-symbols-outlined">logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8">
        {words.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined w-16 h-16 mx-auto mb-4 text-[#484847] block" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>library_books</span>
            <h2 className="font-headline text-xl font-semibold text-white mb-2">生词本为空</h2>
            <p className="text-[#484847] mb-6">搜索歌曲并添加单词到您的生词本</p>
            <Link href="/search">
              <Button className="bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full">
                <span className="material-symbols-outlined mr-2">search</span>
                搜索歌曲
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="w-full mb-6 bg-[#1a1a1a] border border-[#484847]/10 rounded-xl p-1">
              <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-[#72fe8f] data-[state=active]:text-[#005f26] data-[state=active]:rounded-lg font-semibold text-[#adaaaa]">单词列表</TabsTrigger>
              <TabsTrigger value="review" className="flex-1 data-[state=active]:bg-[#72fe8f] data-[state=active]:text-[#005f26] data-[state=active]:rounded-lg font-semibold text-[#adaaaa]">复习模式</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="space-y-3">
                {words.map((word) => (
                  <Card key={word.id} className="bg-[#1a1a1a] border-[#484847]/10 hover:bg-[#262626] transition-colors rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-headline text-xl font-bold text-white">{word.word}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#adaaaa] hover:text-[#72fe8f] rounded-full"
                              onClick={() => speak(word.word)}
                            >
                              <span className="material-symbols-outlined text-lg">volume_up</span>
                            </Button>
                          </div>
                          <p className="text-sm text-[#adaaaa] mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">music_note</span>
                            {word.song_name} - {word.artist}
                          </p>
                          <p className="text-sm text-[#484847] italic">
                            "{word.lyric_context}"
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWord(word.id)}
                          className="text-[#484847] hover:text-[#ff7351] rounded-full"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="review">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {words.map((word) => (
                  <div
                    key={word.id}
                    className="h-40 cursor-pointer"
                    onClick={() => toggleCard(word.id)}
                  >
                    <div
                      className={`relative w-full h-full transition-all duration-300`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flippedCards.has(word.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 bg-[#1a1a1a] border border-[#484847]/10 rounded-2xl p-4 flex flex-col items-center justify-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="font-headline text-2xl font-bold text-white mb-2">{word.word}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#adaaaa] hover:text-[#72fe8f] rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            speak(word.word)
                          }}
                        >
                          <span className="material-symbols-outlined">volume_up</span>
                        </Button>
                        <span className="material-symbols-outlined w-4 h-4 text-[#484847] mt-3">flip</span>
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-[#72fe8f]/10 border border-[#72fe8f]/30 rounded-2xl p-4 flex flex-col items-center justify-center"
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden'
                        }}
                      >
                        <p className="text-[#adaaaa] text-sm text-center mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">music_note</span>
                          {word.song_name}
                        </p>
                        <p className="text-[#484847] text-xs text-center italic">
                          "{word.lyric_context}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
}