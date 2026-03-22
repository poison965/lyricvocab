'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, ArrowLeft, Volume2, Trash2, BookOpen, LogOut, FlipHorizontal, Search } from 'lucide-react'
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
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954] mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-[#181818] border-white/10">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#1DB954]" />
            <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
            <p className="text-gray-400 mb-6">登录后查看您的个人生词本</p>
            <Link href="/login">
              <Button className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold">
                去登录
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#1DB954]" />
              我的生词本
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {words.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h2 className="text-xl font-semibold text-white mb-2">生词本为空</h2>
            <p className="text-gray-500 mb-6">搜索歌曲并添加单词到您的生词本</p>
            <Link href="/search">
              <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold">
                <Search className="w-4 h-4 mr-2" />
                搜索歌曲
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="w-full mb-6 bg-[#181818] border border-white/10">
              <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-[#1DB954] data-[state=active]:text-black">单词列表</TabsTrigger>
              <TabsTrigger value="review" className="flex-1 data-[state=active]:bg-[#1DB954] data-[state=active]:text-black">复习模式</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="space-y-3">
                {words.map((word) => (
                  <Card key={word.id} className="bg-[#181818] border-white/10 hover:bg-[#282828] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-white">{word.word}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-[#1DB954]"
                              onClick={() => speak(word.word)}
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            <Music className="w-3 h-3 inline mr-1" />
                            {word.song_name} - {word.artist}
                          </p>
                          <p className="text-sm text-gray-500 italic">
                            "{word.lyric_context}"
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWord(word.id)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
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
                      className={`relative w-full h-full transition-all duration-300 ${
                        flippedCards.has(word.id) ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flippedCards.has(word.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 bg-[#181818] border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-2xl font-bold text-white mb-2">{word.word}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-[#1DB954]"
                          onClick={(e) => {
                            e.stopPropagation()
                            speak(word.word)
                          }}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        <FlipHorizontal className="w-4 h-4 text-gray-600 mt-3" />
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-lg p-4 flex flex-col items-center justify-center"
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden'
                        }}
                      >
                        <p className="text-gray-300 text-sm text-center mb-2">
                          <Music className="w-3 h-3 inline mr-1" />
                          {word.song_name}
                        </p>
                        <p className="text-gray-500 text-xs text-center italic">
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