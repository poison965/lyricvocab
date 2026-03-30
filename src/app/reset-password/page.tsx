'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/toast'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (session) {
          setIsValidToken(true)
        } else {
          // Check for token in URL hash fragment (Supabase sends it there)
          const hash = window.location.hash
          if (hash.includes('access_token')) {
            setIsValidToken(true)
          } else {
            setError('无效或已过期的重置链接，请重新请求')
          }
        }
      } catch (err) {
        setError('无效或已过期的重置链接，请重新请求')
      } finally {
        setChecking(false)
      }
    }
    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('密码至少需要 6 个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        showToast('密码修改成功，请使用新密码登录', 'success')
        router.push('/login')
      }
    } catch (err) {
      setError('修改失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e]">
        <div className="text-[#72fe8f]">验证中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] p-4">
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-[#88ebff]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/search" className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined w-10 h-10 text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
            <span className="text-3xl font-extrabold text-white font-headline">LyricVocab</span>
          </Link>
        </div>

        <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-headline text-3xl font-extrabold text-white">设置新密码</CardTitle>
            <CardDescription className="text-[#adaaaa] mt-2">请输入您的新密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#adaaaa]">
                  新密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少 6 个字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#262626] border-[#484847]/10 text-white placeholder:text-[#484847] focus-visible:border-[#72fe8f] focus-visible:ring-[#72fe8f]/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#adaaaa]">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#262626] border-[#484847]/10 text-white placeholder:text-[#484847] focus-visible:border-[#72fe8f] focus-visible:ring-[#72fe8f]/20"
                />
              </div>
              {error && (
                <p className="text-sm text-[#ff7351] text-center bg-[#b92902]/10 border border-[#b92902]/20 rounded-xl py-2">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading || !isValidToken}
                className="w-full bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full h-12"
              >
                {loading ? '修改中...' : '确认修改'}
              </Button>
            </form>

            <p className="text-center text-sm text-[#adaaaa] mt-6">
              <Link href="/login" className="text-[#72fe8f] hover:underline font-semibold">
                返回登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e]">
        <div className="text-[#72fe8f]">加载中...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
