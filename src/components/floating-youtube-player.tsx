'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const PLAYLIST = [
  { title: 'Lofi Chill', youtubeId: 'jfKfPfyJRdk' },
  { title: 'Coding Music', youtubeId: 'n61ULEU7CO0' },
  { title: 'Jazz Hop', youtubeId: 'Dx5qFachd3A' }
]

export default function FloatingYoutubePlayer() {
  const { theme } = useTheme()

  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMini, setIsMini] = useState(true)
  const [position, setPosition] = useState({ x: '', y: '' })

  const song = PLAYLIST[current]
  const thumbnail = `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`

  /* ---------------- YT LOAD ---------------- */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer()
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = createPlayer
  }, [])

  const createPlayer = () => {
    if (!playerContainerRef.current || playerRef.current) return

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '0',
      width: '0',
      videoId: song.youtubeId,
      playerVars: { controls: 0, rel: 0 },
      events: {
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
            startProgress()
          }
          if (e.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
            stopProgress()
          }
          if (e.data === window.YT.PlayerState.ENDED) {
            stopProgress()
            next()
          }
        }
      }
    })
  }

  useEffect(() => {
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(song.youtubeId)
    }
  }, [current])

  const startProgress = () => {
    stopProgress()
    progressTimer.current = setInterval(() => {
      if (!playerRef.current) return
      setProgress(playerRef.current.getCurrentTime())
      setDuration(playerRef.current.getDuration())
    }, 500)
  }

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current)
  }

  const togglePlay = () => {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  const next = () => setCurrent((c) => (c + 1) % PLAYLIST.length)

  const prev = () => setCurrent((c) => (c === 0 ? PLAYLIST.length - 1 : c - 1))

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return
    setPosition({ x: `${e.clientX - 40}px`, y: `${e.clientY - 40}px` })
  }

  const progressPercent = duration ? (progress / duration) * 100 : 0

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <div
        ref={playerContainerRef}
        className='absolute -left-[9999px] -top-[9999px]'
      />

      {/* ================= MINI MODE ================= */}
      {isMini && (
        <div
          draggable
          onDragEnd={handleDrag}
          onClick={() => setIsMini(false)}
          style={{
            left: position.x,
            top: position.y,
            right: 20,
            bottom: 20,
            zIndex: 10
          }}
          className='absolute z-50 h-20 w-20 rounded-xl overflow-hidden cursor-pointer shadow-lg'
        >
          <img
            src={thumbnail}
            className='absolute inset-0 h-full w-full object-cover'
          />
          <div className='absolute inset-0  flex items-center justify-center'>
            {isPlaying && (
              <div className='music-wave flex gap-1'>
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className='w-1 bg-white rounded'
                    style={{ height: '20px' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= FULL MODE ================= */}
      {!isMini && (
        <Card
          draggable
          onDragEnd={handleDrag}
          style={{
            left: position.x,
            top: position.y,
            right: 20,
            bottom: 20,
            zIndex: 10
          }}
          className='absolute z-50 w-72 overflow-hidden'
        >
          <div
            className='absolute inset-0 bg-cover bg-center scale-110'
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
          <div
            className={cn(
              'absolute inset-0 backdrop-blur-sm',
              theme === 'dark' ? 'bg-black/20' : 'bg-white/20'
            )}
          />

          <div className='relative'>
            <CardHeader className='flex flex-row items-center justify-between p-3'>
              <CardTitle className='text-xs flex items-center gap-2'>
                <Music className='h-4 w-4' />
                Music
              </CardTitle>
              <Button
                size='icon'
                variant='ghost'
                onClick={() => setIsMini(true)}
              >
                <Minimize2 className='h-4 w-4' />
              </Button>
            </CardHeader>

            <CardContent className='p-3 pt-0 space-y-3'>
              <div className='text-sm font-medium truncate'>{song.title}</div>

              <div className='h-2 w-full rounded bg-muted'>
                <div
                  className='h-2 bg-primary rounded'
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className='flex items-center justify-between'>
                <Button size='icon' variant='secondary' onClick={prev}>
                  <SkipBack className='h-4 w-4' />
                </Button>
                <Button size='icon' onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className='h-4 w-4' />
                  ) : (
                    <Play className='h-4 w-4' />
                  )}
                </Button>
                <Button size='icon' variant='secondary' onClick={next}>
                  <SkipForward className='h-4 w-4' />
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </>
  )
}
