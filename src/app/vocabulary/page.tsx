'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Music, ArrowLeft, Volume2, Trash2, BookOpen, LogOut, FlipHorizontal } from 'lucide-react'
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
  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { speak } = useSpeechSynthesis()
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      fetchWords()
    } else {
      setLoading(false)
    }
  }

  const fetchWords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWords(data || [])
    } catch (error) {
      console.error('Error fetching words:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-bold mb-2">请先登录</h2>
            <p className="text-gray-600 mb-4">登录后查看您的个人单词本</p>
            <Link href="/login">
              <Button className="w-full">去登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-gray-600 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              我的单词本
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {words.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">单词本为空</h2>
            <p className="text-gray-500 mb-4">去搜索歌曲并添加单词吧</p>
            <Link href="/search">
              <Button>搜索歌曲</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="list" className="flex-1">单词列表</TabsTrigger>
              <TabsTrigger value="review" className="flex-1">复习模式</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="space-y-4">
                {words.map((word) => (
                  <Card key={word.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold">{word.word}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => speak(word.word)}
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
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
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
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
                    className="h-48 cursor-pointer perspective-1000"
                    onClick={() => toggleCard(word.id)}
                  >
                    <div
                      className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                        flippedCards.has(word.id) ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transform: flippedCards.has(word.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center backface-hidden">
                        <span className="text-2xl font-bold mb-2">{word.word}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            speak(word.word)
                          }}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        <FlipHorizontal className="w-4 h-4 text-gray-400 mt-2" />
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-blue-50 rounded-lg shadow-md p-4 flex flex-col items-center justify-center backface-hidden"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                      >
                        <p className="text-gray-600 text-sm text-center mb-2">
                          <Music className="w-3 h-3 inline mr-1" />
                          {word.song_name}
                        </p>
                        <p className="text-gray-500 text-sm text-center italic">
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