'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { PlayAudioButtonProps } from '@/lib/types'

// Only one clip plays at a time across the whole page.
let currentAudio: HTMLAudioElement | null = null

const PlayAudioButton = ({ src, autoPlay = false, label = 'Play audio', className = '' }: PlayAudioButtonProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const play = useCallback(() => {
    if (!audioRef.current || audioRef.current.src !== src) {
      const audio = new Audio(src)
      audio.onplay = () => setPlaying(true)
      audio.onpause = () => setPlaying(false)
      audio.onended = () => setPlaying(false)
      audioRef.current = audio
    }
    const audio = audioRef.current

    if (currentAudio && currentAudio !== audio) currentAudio.pause()
    currentAudio = audio
    audio.currentTime = 0
    // Browsers may block autoplay without a recent tap; the button still works.
    audio.play().catch(() => setPlaying(false))
  }, [src])

  useEffect(() => {
    if (autoPlay) play()
    return () => audioRef.current?.pause()
  }, [autoPlay, play])

  return (
    <button
      type="button"
      onClick={play}
      aria-label={label}
      className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-150 ${className}`}
    >
      <Volume2 className={`w-5 h-5 ${playing ? 'animate-pulse' : ''}`} />
    </button>
  )
}

export default PlayAudioButton
