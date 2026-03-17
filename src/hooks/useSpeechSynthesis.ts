'use client'

import { useState, useCallback } from 'react'

interface UseSpeechSynthesisReturn {
  speak: (text: string, lang?: string) => void
  cancel: () => void
  isSpeaking: boolean
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (typeof window === 'undefined') return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, cancel, isSpeaking }
}