'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const userLevel = localStorage.getItem('user_vocabulary_level')
        if (userLevel) {
          router.push('/search')
        } else {
          router.push('/onboarding')
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else if (data.user) {
        const userLevel = localStorage.getItem('user_vocabulary_level')
        if (userLevel) {
          router.push('/search')
        } else {
          router.push('/onboarding')
        }
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] p-4">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#72fe8f]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/search" className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined w-10 h-10 text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
            <span className="text-3xl font-extrabold text-white font-headline">LyricVocab</span>
          </Link>
        </div>

        <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-headline text-3xl font-extrabold text-white">欢迎回来</CardTitle>
            <CardDescription className="text-[#adaaaa] mt-2">登录以继续学习</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#adaaaa]">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#262626] border-[#484847]/10 text-white placeholder:text-[#484847] focus-visible:border-[#72fe8f] focus-visible:ring-[#72fe8f]/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#adaaaa]">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#262626] border-[#484847]/10 text-white placeholder:text-[#484847] focus-visible:border-[#72fe8f] focus-visible:ring-[#72fe8f]/20"
                />
              </div>
              {error && (
                <p className="text-sm text-[#ff7351] text-center bg-[#b92902]/10 border border-[#b92902]/20 rounded-xl py-2">{error}</p>
              )}
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full h-12">
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <p className="text-center text-sm text-[#adaaaa] mt-6">
              还没有账号？{' '}
              <Link href="/register" className="text-[#72fe8f] hover:underline font-semibold">
                注册
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}