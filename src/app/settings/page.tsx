'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon, ArrowLeft, BookOpen, User, LogOut, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

const interestAreas = [
  { id: 'general', name: '通用', description: '日常生活和工作中常用词汇' },
  { id: 'finance', name: '金融', description: '金融、投资、银行相关词汇' },
  { id: 'medical', name: '医学', description: '医学、健康、护理相关词汇' },
  { id: 'technology', name: '科技', description: '科技、互联网、编程相关词汇' },
  { id: 'law', name: '法律', description: '法律、法规、合同相关词汇' },
  { id: 'arts', name: '艺术', description: '戏剧、音乐、文学相关词汇' },
]

const vocabularyLevels = [
  { id: 'beginner', name: '初级', description: '高频常用词汇（约1000词）' },
  { id: 'cet4', name: 'CET-4', description: '大学英语四级词汇（约4500词）' },
  { id: 'cet6', name: 'CET-6', description: '大学英语六级词汇（约6000词）' },
  { id: 'kaoyan', name: '考研', description: '考研英语词汇（约5500词）' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState('cet4')
  const [userInterest, setUserInterest] = useState('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)
      // Load user preferences from localStorage (simplified for now)
      const savedLevel = localStorage.getItem('userLevel')
      const savedInterest = localStorage.getItem('userInterest')
      if (savedLevel) setUserLevel(savedLevel)
      if (savedInterest) setUserInterest(savedInterest)
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
    router.push('/search')
    router.refresh()
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    localStorage.setItem('userLevel', userLevel)
    localStorage.setItem('userInterest', userInterest)
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6" />
              设置
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              个人资料
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-gray-500">已验证邮箱</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              词汇水平
            </CardTitle>
            <CardDescription>选择你的英语水平，系统会自动过滤已掌握的简单词汇</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={userLevel} onValueChange={(value) => value && setUserLevel(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择词汇水平" />
              </SelectTrigger>
              <SelectContent>
                {vocabularyLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    <div>
                      <p className="font-medium">{level.name}</p>
                      <p className="text-xs text-gray-500">{level.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interest Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              兴趣领域
            </CardTitle>
            <CardDescription>选择你感兴趣的领域，重点学习相关词汇</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={userInterest} onValueChange={(value) => value && setUserInterest(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择兴趣领域" />
              </SelectTrigger>
              <SelectContent>
                {interestAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <div className="text-left">
                      <p className="font-medium">{area.name}</p>
                      <p className="text-xs text-gray-500">{area.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-3">
              提示：兴趣领域功能可以帮助你优先学习特定主题的词汇。后续版本将支持自动从歌词中提取领域相关词汇。
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button onClick={handleSavePreferences} disabled={saving} className="min-w-32">
            {saving ? '保存中...' : saved ? (
              <><Check className="w-4 h-4 mr-2" />已保存</>
            ) : '保存设置'}
          </Button>
        </div>
      </main>
    </div>
  )
}