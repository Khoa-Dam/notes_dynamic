'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Clock, Timer } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function Stopwatch() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('countdown')
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [position, setPosition] = useState({ x: '', y: 90 })
  const [inputMinutes, setInputMinutes] = useState<string>('5')

  const handleConfetti = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1']
    const frame = () => {
      if (Date.now() > end) return
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors
      })
      requestAnimationFrame(frame)
    }
    frame()
  }
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Thêm useRef vào danh sách import
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Khởi tạo audio trong useEffect một lần duy nhất khi mount
  useEffect(() => {
    audioRef.current = new Audio('/sounds/alarm-sound.wav') // Thay bằng đường dẫn file của bạn
  }, [])

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0 // Phát lại từ đầu nếu đang phát dở
      audioRef.current
        .play()
        .catch((err) => console.error('Lỗi phát âm thanh:', err))
    }
  }
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTime((prev) => {
          if (mode === 'countdown') {
            if (prev <= 40) {
              clearInterval(timerRef.current!)
              setRunning(false)
              handleConfetti()
              playAlarm()
              // Handle countdown finish
              return 0
            }
            return prev - 10
          }
          return prev + 10
        })
      }, 10)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, mode])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  const handleChangeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/^0+(?=\d)/, '')
    if (sanitized === '' || !isNaN(Number(sanitized))) {
      setInputMinutes(sanitized)
      if (mode === 'countdown' && !running) {
        const value = Number(sanitized)
        setTime(value * 60 * 1000)
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return
    setPosition({ x: `${e.clientX - 100}px`, y: e.clientY - 20 })
  }

  const handleModeChange = (newMode: 'stopwatch' | 'countdown') => {
    if (newMode) {
      setMode(newMode)
      setRunning(false)
      setTime(newMode === 'countdown' ? Number(inputMinutes) * 60 * 1000 : 0)
    }
  }

  return (
    <Card
      draggable
      onDragEnd={handleDrag}
      style={{ left: position.x, top: position.y, right: 0 }}
      className={`absolute p-0 transition-all gap-0 duration-300 z-50 ${
        isCollapsed ? 'w-48' : 'w-72'
      }`}
    >
      <CardHeader
        className={`flex flex-row items-center justify-between ${
          isCollapsed ? 'p-3' : 'p-4'
        }`}
      >
        <CardTitle className='text-sm font-medium uppercase tracking-tighter text-muted-foreground'>
          {mode === 'stopwatch' ? 'Bấm giờ' : 'Đếm ngược'}
        </CardTitle>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        </Button>
      </CardHeader>
      <CardContent className={isCollapsed ? 'p-3 pt-0' : 'p-4 pt-0'}>
        <div
          className={`font-mono text-primary leading-none transition-all text-center ${
            isCollapsed ? 'text-2xl mb-2' : 'text-4xl mb-6'
          }`}
        >
          {formatTime(time)}
        </div>

        {!isCollapsed && (
          <>
            <ToggleGroup
              type='single'
              value={mode}
              onValueChange={handleModeChange}
              className='grid grid-cols-2 w-full'
            >
              <ToggleGroupItem value='stopwatch'>
                <Clock className='h-4 w-4 mr-2' />
                Bấm giờ
              </ToggleGroupItem>
              <ToggleGroupItem value='countdown'>
                <Timer className='h-4 w-4 mr-2' />
                Đếm ngược
              </ToggleGroupItem>
            </ToggleGroup>

            {mode === 'countdown' && !running && (
              <div className='mt-2 flex items-center justify-center gap-2'>
                <Input
                  type='number'
                  value={inputMinutes}
                  onChange={handleChangeTime}
                  className='w-20 text-center'
                />
                <span className='text-muted-foreground text-sm'>phút</span>
              </div>
            )}
          </>
        )}
      </CardContent>
      {!isCollapsed && (
        <CardFooter className='flex gap-2 p-6 pt-0'>
          <Button
            onClick={() => setRunning(!running)}
            variant={running ? 'destructive' : 'default'}
            className='flex-1'
          >
            {running ? 'Dừng' : 'Bắt đầu'}
          </Button>
          <Button
            onClick={() => {
              setRunning(false)
              setTime(
                mode === 'countdown' ? Number(inputMinutes) * 60 * 1000 : 0
              )
            }}
            variant='secondary'
          >
            Reset
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
