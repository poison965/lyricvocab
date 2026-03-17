'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Music, ArrowLeft, Volume2, Check, BookOpen, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
}

interface MatchedWord {
  word: string
  originalWord: string
  lineIndex: number
  fullLine: string
}

function SongContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''

  const [track, setTrack] = useState<Track | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [words, setWords] = useState<MatchedWord[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [level, setLevel] = useState('cet4')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Get track from sessionStorage
    const stored = sessionStorage.getItem('currentSong')
    if (stored) {
      setTrack(JSON.parse(stored))
    }
  }, [])

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
    router.push('/search')
    router.refresh()
  }

  const fetchLyrics = async () => {
    if (!track) return
    setLoading(true)

    try {
      const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(track.artist)}&song=${encodeURIComponent(track.name)}`)
      const data = await res.json()

      if (data.lyrics) {
        setLyrics(data.lyrics)
      }
    } catch (error) {
      console.error('Failed to fetch lyrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractWords = async () => {
    if (!lyrics) {
      await fetchLyrics()
      return
    }

    setExtracting(true)

    try {
      const res = await fetch('/api/words/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics, level }),
      })
      const data = await res.json()

      if (data.words) {
        setWords(data.words)
        // Select all by default
        setSelectedWords(new Set(data.words.map((w: MatchedWord) => w.word)))
      }
    } catch (error) {
      console.error('Failed to extract words:', error)
    } finally {
      setExtracting(false)
    }
  }

  const toggleWord = (word: string) => {
    const newSelected = new Set(selectedWords)
    if (newSelected.has(word)) {
      newSelected.delete(word)
    } else {
      newSelected.add(word)
    }
    setSelectedWords(newSelected)
  }

  const selectAll = () => {
    if (selectedWords.size === words.length) {
      setSelectedWords(new Set())
    } else {
      setSelectedWords(new Set(words.map(w => w.word)))
    }
  }

  const saveSelectedWords = async () => {
    if (!track) return

    setSaving(true)
    setSavedMessage('')

    const wordsToSave = words.filter(w => selectedWords.has(w.word))

    try {
      for (const wordItem of wordsToSave) {
        const res = await fetch('/api/words/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: wordItem.word,
            translation: null,
            songName: track.name,
            artist: track.artist,
            lyricContext: wordItem.fullLine,
            songId: track.id,
          }),
        })

        const data = await res.json()
        if (data.error && data.error !== '单词已存在') {
          console.error('Failed to save word:', wordItem.word, data.error)
        }
      }

      setSavedMessage(`已添加 ${wordsToSave.length} 个单词到单词本`)
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save words:', error)
    } finally {
      setSaving(false)
    }
  }

  const highlightWord = (line: string, word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    return line.replace(regex, match => `<mark class="bg-yellow-200">${match}</mark>`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <Music className="w-6 h-6" />
              LyricVocab
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/search" className="text-gray-600 hover:text-blue-600">搜索</Link>
            <Link href="/vocabulary" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />单词本
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Song Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="w-48 h-48 mx-auto mb-4 bg-gray-200 rounded-lg overflow-hidden">
                  {track?.image ? (
                    <img src={track.image} alt={track.album} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-center mb-2">{track?.name || '加载中...'}</h2>
                <p className="text-gray-600 text-center mb-2">{track?.artist}</p>
                <p className="text-gray-400 text-sm text-center">{track?.album}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Words */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>提取单词</CardTitle>
                  <Select value={level} onValueChange={(value) => value && setLevel(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cet4">四级词汇</SelectItem>
                      <SelectItem value="cet6">六级词汇</SelectItem>
                      <SelectItem value="kaoyan">考研词汇</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={extractWords}
                  disabled={extracting}
                  className="w-full mb-4"
                >
                  {extracting ? '提取中...' : lyrics ? '重新提取单词' : '提取单词'}
                </Button>

                {words.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        {selectedWords.size === words.length ? '取消全选' : '全选'}
                      </Button>
                      <span className="text-sm text-gray-500">
                        已选 {selectedWords.size}/{words.length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {words.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Checkbox
                            checked={selectedWords.has(item.word)}
                            onCheckedChange={() => toggleWord(item.word)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.word}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const utterance = new SpeechSynthesisUtterance(item.word)
                                  utterance.lang = 'en-US'
                                  speechSynthesis.speak(utterance)
                                }}
                              >
                                <Volume2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p
                              className="text-sm text-gray-600 mt-1"
                              dangerouslySetInnerHTML={{
                                __html: highlightWord(item.fullLine, item.originalWord)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={saveSelectedWords}
                      disabled={saving || selectedWords.size === 0}
                      className="w-full mt-4"
                    >
                      {saving ? '保存中...' : `添加到单词本 (${selectedWords.size})`}
                    </Button>

                    {savedMessage && (
                      <p className="text-green-600 text-center mt-2">{savedMessage}</p>
                    )}
                  </>
                )}

                {words.length === 0 && !extracting && (
                  <p className="text-center text-gray-500 py-4">
                    点击"提取单词"从歌词中提取符合考纲的词汇
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SongPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <SongContent />
    </Suspense>
  )
}