'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon, LogOut, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/toast'

const interestAreas = [
  { id: 'general', name: '通用', description: '日常生活和工作词汇' },
  { id: 'finance', name: '金融', description: '金融、投资、银行' },
  { id: 'medical', name: '医学', description: '医学、健康、护理' },
  { id: 'technology', name: '科技', description: '科技、互联网、编程' },
  { id: 'law', name: '法律', description: '法律、法规、合同' },
  { id: 'arts', name: '艺术', description: '戏剧、音乐、文学' },
]

const vocabularyLevels = [
  { id: 'cet4', name: 'CET-4 / 四级', description: '大学英语四级 (~4500词)' },
  { id: 'cet6', name: 'CET-6 / 六级', description: '大学英语六级 (~6000词)' },
  { id: 'kaoyan', name: '考研', description: '研究生入学考试 (~5500词)' },
  { id: 'tem4', name: 'TEM-4 / 专四', description: '英语专业四级 (~8000词)' },
  { id: 'tem8', name: 'TEM-8 / 专八', description: '英语专业八级 (~13000词)' },
  { id: 'ielts', name: 'IELTS / 雅思', description: '雅思词汇 (~7000词)' },
  { id: 'toefl', name: 'TOEFL / 托福', description: '托福词汇 (~8000词)' },
  { id: 'gre', name: 'GRE', description: 'GRE词汇 (~20000词)' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState('cet4')
  const [userInterest, setUserInterest] = useState('general')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const onboardingLevel = localStorage.getItem('user_vocabulary_level')
      const onboardingInterests = localStorage.getItem('user_interests')
      const savedLevel = localStorage.getItem('userLevel')
      const savedInterest = localStorage.getItem('userInterest')

      if (onboardingLevel) setUserLevel(onboardingLevel)
      else if (savedLevel) setUserLevel(savedLevel)

      if (onboardingInterests) {
        try {
          const interests = JSON.parse(onboardingInterests)
          if (interests.includes('daily') || interests.includes('love')) setUserInterest('general')
          if (interests.includes('finance')) setUserInterest('finance')
          if (interests.includes('medical')) setUserInterest('medical')
          if (interests.includes('tech')) setUserInterest('technology')
          if (interests.includes('art')) setUserInterest('arts')
        } catch {
          // ignore parse errors
        }
      } else if (savedInterest) {
        setUserInterest(savedInterest)
      }

      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    localStorage.setItem('userLevel', userLevel)
    localStorage.setItem('userInterest', userInterest)
    localStorage.setItem('user_vocabulary_level', userLevel)

    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    showToast('设置已保存', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#72fe8f]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-xl nav-glow sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="text-[#adaaaa] hover:text-white rounded-full">
                <span className="material-symbols-outlined">arrow_back</span>
              </Button>
            </Link>
            <h1 className="font-headline text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>settings</span>
              设置
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">
        {/* User Info Card */}
        <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-headline font-medium text-white">{user?.email}</p>
                <p className="text-sm text-[#adaaaa]">已验证邮箱</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-[#484847]/30 text-[#adaaaa] hover:bg-[#262626] hover:text-white rounded-xl">
                <span className="material-symbols-outlined mr-2">logout</span>
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Level */}
        <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white font-headline">
              <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu_book</span>
              词汇等级
            </CardTitle>
            <CardDescription className="text-[#adaaaa]">
              选择您的英语水平，系统将自动过滤您已掌握的简单词汇
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={userLevel} onValueChange={(value) => value && setUserLevel(value)}>
              <SelectTrigger className="w-full bg-[#262626] border-[#484847]/10 text-white rounded-xl">
                <SelectValue placeholder="选择词汇等级" />
              </SelectTrigger>
              <SelectContent className="bg-[#262626] border-[#484847]/10 rounded-xl">
                {vocabularyLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id} className="text-white rounded-lg">
                    <div>
                      <p className="font-medium">{level.name}</p>
                      <p className="text-xs text-[#adaaaa]">{level.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interest Area */}
        <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white font-headline">
              <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>tune</span>
              兴趣领域
            </CardTitle>
            <CardDescription className="text-[#adaaaa]">
              选择您的兴趣领域，优先展示相关词汇
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={userInterest} onValueChange={(value) => value && setUserInterest(value)}>
              <SelectTrigger className="w-full bg-[#262626] border-[#484847]/10 text-white rounded-xl">
                <SelectValue placeholder="选择兴趣领域" />
              </SelectTrigger>
              <SelectContent className="bg-[#262626] border-[#484847]/10 rounded-xl">
                {interestAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id} className="text-white rounded-lg">
                    <div className="text-left">
                      <p className="font-medium">{area.name}</p>
                      <p className="text-xs text-[#adaaaa]">{area.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="min-w-32 bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full"
          >
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </main>
    </div>
  )
}