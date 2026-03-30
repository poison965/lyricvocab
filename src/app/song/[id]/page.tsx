'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Music, Sparkles, Loader2, Play, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import YouTube from 'react-youtube'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/skeleton'
import { useToast } from '@/components/toast'

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  previewUrl?: string | null
}

interface MatchedWord {
  word: string
  originalWord: string
  lineIndex: number
  fullLine: string
  level: string
  importance: number
  source_reason: string
  domain?: string
  isDomain: boolean
  difficulty_level: string
  professionalTip?: string | null
  translation?: string
}

interface MatchedPhrase {
  phrase: string
  lineIndex: number
  fullLine: string
}

// Interface for timestamp data from lyrics API
interface LyricTimestamp {
  time: number
  text: string
  endTime?: number
}

function SongContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''

  const [track, setTrack] = useState<Track | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [timestamps, setTimestamps] = useState<LyricTimestamp[]>([])
  const [hasTimestamps, setHasTimestamps] = useState(false)
  const [words, setWords] = useState<MatchedWord[]>([])
  const [phrases, setPhrases] = useState<MatchedPhrase[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [selectedPhrases, setSelectedPhrases] = useState<Set<string>>(new Set())
  const [level, setLevel] = useState('cet4')
  const [difficultySlider, setDifficultySlider] = useState(3)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractingPhrases, setExtractingPhrases] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  // Audio player state
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentlyPlayingLine, setCurrentlyPlayingLine] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // YouTube player state
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubeReady, setYoutubeReady] = useState(false)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0)
  const youtubeRef = useRef<any>(null)
  const youtubeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const stored = sessionStorage.getItem('currentSong')
    if (stored) {
      const trackData = JSON.parse(stored)
      setTrack(trackData)
      // 自动设置音频URL（如果iTunes提供previewUrl）
      if (trackData.previewUrl) {
        setAudioUrl(trackData.previewUrl)
      }
      // 获取YouTube视频ID
      fetchYoutubeId()
    }

    const userLevel = localStorage.getItem('user_vocabulary_level')
    if (userLevel) {
      const levelMap: Record<string, string> = {
        'basic': 'cet4',
        'cet4': 'cet4',
        'cet6': 'cet6',
        'kaoyan': 'kaoyan'
      }
      const mappedLevel = levelMap[userLevel] || 'cet4'
      setLevel(mappedLevel)
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
    router.push('/login')
  }

  const fetchLyrics = async () => {
    if (!track) return
    setLoading(true)

    try {
      const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(track.artist)}&song=${encodeURIComponent(track.name)}`)
      const data = await res.json()

      if (data.lyrics) {
        setLyrics(data.lyrics)
        setTimestamps(data.timestamps || [])
        setHasTimestamps(data.hasTimestamps || false)
      }
    } catch (error) {
      console.error('Failed to fetch lyrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch YouTube video ID
  const fetchYoutubeId = async () => {
    if (!track) return
    setYoutubeLoading(true)

    try {
      const res = await fetch(`/api/youtube/search?artist=${encodeURIComponent(track.artist)}&song=${encodeURIComponent(track.name)}`)
      const data = await res.json()

      if (data.youtubeId) {
        setYoutubeId(data.youtubeId)
      }
    } catch (error) {
      console.error('Failed to fetch YouTube ID:', error)
    } finally {
      setYoutubeLoading(false)
    }
  }

  // YouTube player ready handler
  const onYoutubeReady = (event: any) => {
    const player = event.target
    setYoutubePlayer(player)
    setYoutubeReady(true)

    // Start time tracking
    youtubeIntervalRef.current = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime()
        setYoutubeCurrentTime(currentTime)

        // Check if we've reached the end time of current line
        if (currentlyPlayingLine !== null) {
          const lineTimestamp = timestamps[currentlyPlayingLine]
          if (lineTimestamp?.endTime && currentTime >= lineTimestamp.endTime - 0.5) {
            player.pauseVideo()
            setIsPlaying(false)
            setCurrentlyPlayingLine(null)
          }
        }
      } catch (e) {
        // Player may not be ready
      }
    }, 500)
  }

  // YouTube state change handler
  const onYoutubeStateChange = (event: any) => {
    const player = event.target
    const state = player.getPlayerState()

    if (state === 1) { // Playing
      setIsPlaying(true)
    } else if (state === 2) { // Paused
      setIsPlaying(false)
    } else if (state === 0) { // Ended
      setIsPlaying(false)
      setCurrentlyPlayingLine(null)
    }
  }

  // Audio playback functions
  const playLine = (lineIndex: number) => {
    // Try to find timestamp by matching line content
    const lyricsLines = lyrics.split('\n').filter(l => l.trim())
    const targetLine = lyricsLines[lineIndex]?.trim() || ''

    // Find matching timestamp by text content
    let lineTimestamp = timestamps.find(t =>
      t.text.toLowerCase().trim() === targetLine.toLowerCase().trim()
    )

    // Fallback to index if not found
    if (!lineTimestamp) {
      lineTimestamp = timestamps[lineIndex]
    }

    if (!lineTimestamp) return

    // Try YouTube first, fallback to audio
    if (youtubeReady && youtubePlayer && youtubeId) {
      // Use YouTube player
      youtubePlayer.seekTo(lineTimestamp.time, true)
      youtubePlayer.playVideo()
      setIsPlaying(true)
      setCurrentlyPlayingLine(lineIndex)
      return
    }

    // Fallback to audio element
    if (!audioRef.current || !hasTimestamps) return

    audioRef.current.currentTime = lineTimestamp.time
    audioRef.current.play()
    setIsPlaying(true)
    setCurrentlyPlayingLine(lineIndex)

    if (lineTimestamp.endTime) {
      setTimeout(() => {
        if (audioRef.current && audioRef.current.currentTime >= lineTimestamp!.endTime! - 0.5) {
          audioRef.current.pause()
          setIsPlaying(false)
          setCurrentlyPlayingLine(null)
        }
      }, (lineTimestamp.endTime - lineTimestamp.time) * 1000)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setCurrentlyPlayingLine(null)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentlyPlayingLine(null)
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
        body: JSON.stringify({
          lyrics,
          level,
          difficultySlider,
          minWords: 12
        }),
      })
      const data = await res.json()

      if (data.words) {
        setWords(data.words)
        setSelectedWords(new Set(data.words.map((w: MatchedWord) => w.word)))
      }
    } catch (error) {
      console.error('Failed to extract words:', error)
    } finally {
      setExtracting(false)
    }
  }

  // Extract common English phrases and idioms
  const extractPhrases = async () => {
    let currentLyrics = lyrics

    // Fetch lyrics if not available
    if (!currentLyrics && track) {
      setLoading(true)
      try {
        const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(track.artist)}&song=${encodeURIComponent(track.name)}`)
        const data = await res.json()
        if (data.lyrics) {
          currentLyrics = data.lyrics
          setLyrics(data.lyrics)
        }
      } catch (error) {
        console.error('Failed to fetch lyrics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!currentLyrics) {
      setExtractingPhrases(false)
      return
    }

    setExtractingPhrases(true)

    // Extended common phrases and idioms - more comprehensive list
    const commonPhrases = [
      // Common idioms
      'birds of a feather', 'break the ice', 'hit the road', 'piece of cake',
      'once in a blue moon', 'under the weather', 'spill the beans', 'let the cat out of the bag',
      'kill two birds with one stone', 'beat around the bush', 'the ball is in your court',
      'broke the record', 'catch up', 'fall apart', 'figure out', 'give up', 'grow up',
      'hang out', 'hit the sack', 'keep in touch', 'look forward to', 'make up',
      'put off', 'run out', 'set up', 'take off', 'throw away', 'turn down',
      'wake up', 'work out', 'as a matter of fact', 'at first sight', 'by chance',
      'for good', 'in a hurry', 'in fact', 'in general', 'in order to', 'no doubt',
      'of course', 'on purpose', 'to be honest', 'all over', 'back and forth',
      'each other', 'even though', 'far away', 'first of all', 'for example',
      'for instance', 'in addition', 'in conclusion', 'in contrast', 'in other words',
      'on the other hand', 'over time', 'so far', 'such as', 'to sum up',
      'what is more', 'all the best', 'as usual', 'best wishes', 'good luck',
      'have a nice day', 'how are you', 'nice to meet you', 'see you later',
      'take care', 'thank you very much', 'you are welcome', 'i am sorry',
      'i believe', 'i guess', 'i think', 'in my opinion', 'to tell the truth',
      'as a result', 'because of', 'due to', 'for this reason', 'that is why',
      'what is worse', 'so that', 'unless', 'instead of', 'rather than',
      'not only but also', 'both and', 'either or', 'neither nor',
      // More common expressions in songs
      'all i need', 'all my life', 'over you', 'let it go', 'let it be',
      'come back', 'come true', 'go away', 'go on', 'carry on', 'move on',
      'stay with me', 'wait for me', 'think about', 'think of', 'dream of',
      'fall in love', 'break up', 'hold on', 'hand in hand', 'side by side',
      'face to face', 'year by year', 'day by day', 'step by step',
      'one by one', 'here and there', 'up and down', 'back and forth',
      'now and then', 'more or less', 'sooner or later', 'again and again',
      'more than', 'less than', 'rather', 'so-called', 'well-known',
      'hard to', 'easy to', 'ready to', 'sorry for', 'proud of',
      'tired of', 'afraid of', 'full of', 'kind of', 'sort of',
      'out of', 'instead', 'anyway', 'however', 'although', 'though',
      'whether', 'whatever', 'whenever', 'wherever', 'whoever'
    ]

    try {
      const lines = currentLyrics.split('\n')
      const foundPhrases: MatchedPhrase[] = []
      const seenPhrases = new Set<string>()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().replace(/[^\w\s']/g, ' ')

        for (const phrase of commonPhrases) {
          // Use word boundary to avoid partial matches
          const phraseRegex = new RegExp(`\\b${phrase.replace(/ /g, '\\s+')}\\b`, 'i')
          if (phraseRegex.test(line) && !seenPhrases.has(phrase)) {
            seenPhrases.add(phrase)
            foundPhrases.push({
              phrase: phrase,
              lineIndex: i,
              fullLine: lines[i].trim()
            })
          }
        }
      }

      setPhrases(foundPhrases)
      setSelectedPhrases(new Set(foundPhrases.map(p => p.phrase)))
    } catch (error) {
      console.error('Failed to extract phrases:', error)
    } finally {
      setExtractingPhrases(false)
    }
  }

  const togglePhrase = (phrase: string) => {
    const newSelected = new Set(selectedPhrases)
    if (newSelected.has(phrase)) {
      newSelected.delete(phrase)
    } else {
      newSelected.add(phrase)
    }
    setSelectedPhrases(newSelected)
  }

  const selectAllPhrases = () => {
    if (selectedPhrases.size === phrases.length) {
      setSelectedPhrases(new Set())
    } else {
      setSelectedPhrases(new Set(phrases.map(p => p.phrase)))
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

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      showToast('请先登录', 'error')
      return
    }

    setSaving(true)

    const wordsToSave = words.filter(w => selectedWords.has(w.word))
    const phrasesToSave = phrases.filter(p => selectedPhrases.has(p.phrase))

    let savedCount = 0

    try {
      // Save selected words
      for (const wordItem of wordsToSave) {
        const { error } = await supabase
          .from('user_vocabulary')
          .insert({
            user_id: session.user.id,
            word: wordItem.word,
            translation: null,
            song_name: track.name,
            artist: track.artist,
            lyric_context: wordItem.fullLine,
            song_id: track.id,
            status: 'learning',
          })

        if (error) {
          if (error.code !== '23505') {
            console.error('Failed to save word:', wordItem.word, error.message)
          }
        } else {
          savedCount++
        }
      }

      // Save selected phrases (as special format)
      for (const phraseItem of phrasesToSave) {
        const { error } = await supabase
          .from('user_vocabulary')
          .insert({
            user_id: session.user.id,
            word: phraseItem.phrase,
            translation: '[短语]',
            song_name: track.name,
            artist: track.artist,
            lyric_context: phraseItem.fullLine,
            song_id: track.id,
            status: 'learning',
          })

        if (error) {
          if (error.code !== '23505') {
            console.error('Failed to save phrase:', phraseItem.phrase, error.message)
          }
        } else {
          savedCount++
        }
      }

      showToast(`已添加 ${savedCount} 项到生词本`, 'success')
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const highlightWord = (line: string, word: string) => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi')
    return line.replace(regex, '<strong class="text-[#72fe8f] border-b-2 border-[#1DB954] font-semibold">$1</strong>')
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-xl nav-glow sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#adaaaa] hover:text-white rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
            <h1 className="font-headline text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
              LyricVocab
            </h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/search" className="text-[#adaaaa] hover:text-white text-sm font-medium">搜索</Link>
            <Link href="/vocabulary" className="text-[#adaaaa] hover:text-white flex items-center gap-1 text-sm font-medium">
              <span className="material-symbols-outlined text-lg">menu_book</span>
              生词本
            </Link>
            {!initializing && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/settings" className="text-[#adaaaa] hover:text-white flex items-center gap-1 text-sm font-medium">
                      <span className="material-symbols-outlined text-lg">settings</span>
                      {user.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-[#adaaaa] hover:text-white flex items-center gap-1 text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
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
          </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Song Info */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
              <CardContent className="p-6">
                <div className="w-48 h-48 mx-auto mb-4 bg-[#262626] rounded-2xl overflow-hidden">
                  {track?.image ? (
                    <img src={track.image} alt={track.album} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined w-16 h-16 text-[#484847]">album</span>
                    </div>
                  )}
                </div>
                <h2 className="font-headline text-xl font-bold text-white text-center mb-2">{track?.name || 'Loading...'}</h2>
                <p className="text-[#adaaaa] text-center mb-2">{track?.artist}</p>
                <p className="text-[#484847] text-sm text-center">{track?.album}</p>

                {/* Audio URL Input */}
                <div className="mt-4">
                  <label className="text-xs text-[#adaaaa] mb-1 block font-label">音频链接 (可选)</label>
                  <input
                    type="text"
                    placeholder="输入音频URL以启用歌词播放"
                    value={audioUrl || ''}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#262626] border border-[#484847]/10 rounded-xl text-white text-sm placeholder:text-[#484847]"
                  />
                </div>

                {/* Audio Player / YouTube Player */}
                {(audioUrl || youtubeId) && (
                  <div className="mt-4">
                    {/* Hidden YouTube Player */}
                    {youtubeId && (
                      <div className="hidden">
                        <YouTube
                          ref={youtubeRef}
                          videoId={youtubeId}
                          opts={{
                            width: '1',
                            height: '1',
                            playerVars: {
                              autoplay: 0,
                              controls: 0,
                              modestbranding: 1,
                              rel: 0,
                            },
                          }}
                          onReady={onYoutubeReady}
                          onStateChange={onYoutubeStateChange}
                        />
                      </div>
                    )}

                    {/* Audio fallback */}
                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleAudioEnded}
                      />
                    )}

                    <div className="flex items-center gap-3">
                      {/* Play/Pause Button */}
                      <Button
                        onClick={() => {
                          if (youtubeReady && youtubePlayer) {
                            if (isPlaying) {
                              youtubePlayer.pauseVideo()
                            } else {
                              youtubePlayer.playVideo()
                            }
                          } else if (audioUrl) {
                            togglePlayPause()
                          }
                        }}
                        disabled={!youtubeId && !audioUrl}
                        className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black disabled:opacity-50"
                      >
                        {youtubeLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPlaying ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </Button>

                      {/* Progress Bar */}
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={youtubePlayer ? (youtubePlayer.getDuration?.() || 100) : (duration || 100)}
                          value={youtubeId ? youtubeCurrentTime : currentTime}
                          onChange={(e) => {
                            const time = parseFloat(e.target.value)
                            if (youtubePlayer) {
                              youtubePlayer.seekTo(time, true)
                            } else if (audioRef.current) {
                              audioRef.current.currentTime = time
                            }
                          }}
                          className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#72fe8f]"
                        />
                        <div className="flex justify-between text-xs text-[#484847] mt-1">
                          <span>{Math.floor((youtubeId ? youtubeCurrentTime : currentTime) / 60)}:{Math.floor((youtubeId ? youtubeCurrentTime : currentTime) % 60).toString().padStart(2, '0')}</span>
                          <span>{Math.floor((youtubePlayer ? youtubePlayer.getDuration?.() || 0 : duration) / 60)}:{Math.floor((youtubePlayer ? youtubePlayer.getDuration?.() || 0 : duration) % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>

                    {/* YouTube loading indicator */}
                    {youtubeLoading && (
                      <p className="text-xs text-[#484847] mt-2 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        正在加载YouTube音频...
                      </p>
                    )}
                  </div>
                )}

                {/* Lyrics Display with Timestamps */}
                {lyrics && (
                  <div className="mt-4">
                    <p className="text-xs text-[#adaaaa] mb-2">
                      {(hasTimestamps && (youtubeId || audioUrl)) ? '点击歌词行播放对应片段' : '歌词'}
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {lyrics.split('\n').filter(l => l.trim()).map((line, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded transition-colors flex items-center gap-2 ${
                            (hasTimestamps && (youtubeId || audioUrl))
                              ? currentlyPlayingLine === idx
                                ? 'bg-[#1DB954]/30 text-[#72fe8f] cursor-pointer'
                                : 'text-[#adaaaa] hover:bg-white/5 cursor-pointer'
                              : 'text-[#484847]'
                          }`}
                          onClick={() => hasTimestamps && (youtubeId || audioUrl) && playLine(idx)}
                        >
                          {/* Play indicator */}
                          {hasTimestamps && (youtubeId || audioUrl) && timestamps[idx] && (
                            <span className={`flex-shrink-0 ${currentlyPlayingLine === idx ? 'text-[#72fe8f]' : 'text-gray-600'}`}>
                              {currentlyPlayingLine === idx ? (
                                <div className="w-3 h-3">
                                  <span className="animate-pulse">🔊</span>
                                </div>
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </span>
                          )}
                          <span className="flex-1">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Words */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1a1a] border-[#484847]/10">
              <CardHeader>
                <CardTitle className="text-white mb-4">提取单词</CardTitle>

                {/* Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Level Selector */}
                  <div>
                    <label className="text-xs text-[#adaaaa] mb-1 block">词汇等级</label>
                    <Select value={level} onValueChange={(value) => value && setLevel(value)}>
                      <SelectTrigger className="w-full bg-[#262626] border-[#484847]/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#262626] border-[#484847]/10">
                        <SelectItem value="cet4" className="text-white">CET-4 / 四级</SelectItem>
                        <SelectItem value="cet6" className="text-white">CET-6 / 六级</SelectItem>
                        <SelectItem value="kaoyan" className="text-white">考研</SelectItem>
                        <SelectItem value="tem4" className="text-white">TEM-4 / 专四</SelectItem>
                        <SelectItem value="tem8" className="text-white">TEM-8 / 专八</SelectItem>
                        <SelectItem value="ielts" className="text-white">IELTS / 雅思</SelectItem>
                        <SelectItem value="toefl" className="text-white">TOEFL / 托福</SelectItem>
                        <SelectItem value="gre" className="text-white">GRE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty Slider */}
                  <div>
                    <label className="text-xs text-[#adaaaa] mb-1 block">
                      难度: {
                        difficultySlider === 1 ? '入门' :
                        difficultySlider === 2 ? '基础' :
                        difficultySlider === 3 ? '中级' :
                        difficultySlider === 4 ? '高级' : '专家'
                      }
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={difficultySlider}
                      onChange={(e) => setDifficultySlider(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#72fe8f]"
                    />
                    <div className="flex justify-between text-xs text-[#484847] mt-1">
                      <span>入门</span>
                      <span>基础</span>
                      <span>中级</span>
                      <span>高级</span>
                      <span>专家</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={extractWords}
                  disabled={extracting}
                  variant="outline"
                  className="w-full mb-4 border-[#1DB954] text-[#72fe8f] hover:bg-[#1DB954]/10 font-semibold"
                >
                  {extracting ? '提取中...' : lyrics ? '重新提取' : '提取单词'}
                </Button>

                {words.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="outline" size="sm" onClick={selectAll} className="border-white/20 text-white hover:bg-white/10">
                        {selectedWords.size === words.length ? '取消全选' : '全选'}
                      </Button>
                      <span className="text-sm text-[#adaaaa]">
                        已选择 {selectedWords.size}/{words.length}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {words.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 bg-[#282828] rounded-lg hover:bg-[#2c2c2c] transition-colors min-h-[72px]"
                        >
                          <Checkbox
                            checked={selectedWords.has(item.word)}
                            onCheckedChange={() => toggleWord(item.word)}
                            className="mt-0.5 border-white/30 data-[state=checked]:bg-[#1DB954] data-[state=checked]:border-[#1DB954] shrink-0"
                          />
                          {/* Left: Word, Tags, Pronunciation */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm">{item.word}</span>
                              {/* Difficulty Badge */}
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
                                item.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                item.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                item.difficulty_level === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                                'text-indigo-400 bg-indigo-400/10 border border-indigo-400/20'
                              }`}>
                                {item.difficulty_level === 'beginner' ? '入门' :
                                 item.difficulty_level === 'intermediate' ? '中级' :
                                 item.difficulty_level === 'advanced' ? '高级' : '专家'}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-[#adaaaa] hover:text-[#72fe8f] shrink-0"
                                onClick={() => {
                                  const utterance = new SpeechSynthesisUtterance(item.word)
                                  utterance.lang = 'en-US'
                                  speechSynthesis.speak(utterance)
                                }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            {/* Professional Tip as translation */}
                            {(item.professionalTip || item.translation) && (
                              <p className="text-xs text-gray-300 mt-0.5 truncate">
                                {item.professionalTip || item.translation}
                              </p>
                            )}
                            {/* Example sentence */}
                            <p
                              className="text-xs text-[#484847] mt-0.5 line-clamp-1"
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
                      className="w-full mt-4 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
                    >
                      {saving ? '保存中...' : `添加到生词本 (单词: ${selectedWords.size}, 短语: ${selectedPhrases.size})`}
                    </Button>
                  </>
                )}

                {words.length === 0 && !extracting && (
                  <p className="text-center text-[#484847] py-4">
                    点击"提取单词"从歌词中提取考试相关词汇
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Phrase Extraction Card */}
            <Card className="bg-[#1a1a1a] border-[#484847]/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#72fe8f]" />
                    短语/搭配提取
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={extractPhrases}
                  disabled={extractingPhrases}
                  className="w-full mb-4 bg-[#9B59B6] hover:bg-[#8E44AD] text-white font-semibold"
                >
                  {extractingPhrases ? '提取中...' : lyrics ? '提取短语' : '请先提取歌词'}
                </Button>

                {phrases.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="outline" size="sm" onClick={selectAllPhrases} className="border-white/20 text-white hover:bg-white/10">
                        {selectedPhrases.size === phrases.length ? '取消全选' : '全选'}
                      </Button>
                      <span className="text-sm text-[#adaaaa]">
                        已选择 {selectedPhrases.size}/{phrases.length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {phrases.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-[#282828] rounded-lg hover:bg-[#2c2c2c] transition-colors"
                        >
                          <Checkbox
                            checked={selectedPhrases.has(item.phrase)}
                            onCheckedChange={() => togglePhrase(item.phrase)}
                            className="mt-1 border-white/30 data-[state=checked]:bg-[#9B59B6] data-[state=checked]:border-[#9B59B6]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{item.phrase}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-[#adaaaa] hover:text-[#9B59B6]"
                                onClick={() => {
                                  const utterance = new SpeechSynthesisUtterance(item.phrase)
                                  utterance.lang = 'en-US'
                                  speechSynthesis.speak(utterance)
                                }}
                              >
                                <Volume2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-[#adaaaa] mt-1">
                              "{item.fullLine}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {phrases.length === 0 && !extractingPhrases && (
                  <p className="text-center text-[#484847] py-4">
                    点击"提取短语"从歌词中提取常用表达和习惯用语
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0e0e0e]">
        <header className="bg-black/60 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-2xl p-6">
                <Skeleton className="w-48 h-48 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto mb-2" />
                <Skeleton className="h-3 w-48 mx-auto" />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1a1a1a] rounded-2xl p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    }>
      <SongContent />
    </Suspense>
  )
}