'use client'

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
}

const BotMessage = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => (
          <p className='text-xl mb-2 last:mb-0' {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className='text-xl list-decimal list-inside' {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className='text-xl list-disc list-inside' {...props} />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

const eyeAnimationStyle = `
  @keyframes move-eye {
    0%, 100% { transform: translate(40%, -30%); }
    10% { transform: translate(40%, -30%); }
    20% { transform: translate(-40%, -30%); }
    30% { transform: translate(-40%, -30%); }
    40% { transform: translate(0%, 35%); }
    50% { transform: translate(0%, 35%); }
    60% { transform: translate(40%, -30%); }
    70% { transform: translate(40%, -30%); }
    80% { transform: translate(-40%, 30%); }
    90% { transform: translate(-40%, 30%); }
  }
  .eye-pupil {
    animation: move-eye 8s ease-in-out infinite;
  }
`

export default function GeminiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const styleSheet = document.createElement('style')
    styleSheet.innerText = eyeAnimationStyle
    document.head.appendChild(styleSheet)
    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user'
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: `bot-${Date.now()}`, text: '', sender: 'bot' }
    ])

    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        const chunk = decoder.decode(value, { stream: true })

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.sender === 'bot') {
            lastMessage.text += chunk
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error fetching AI response:', error)
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `bot-error-${Date.now()}`,
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className='flex flex-col h-full'>
      <Card className='flex flex-col flex-1 rounded-lg shadow-xl bg-background/50'>
        <CardHeader className='flex flex-row items-center justify-between pb-2 border-b'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-purple-500' />
            Dnote Chat
          </CardTitle>
        </CardHeader>
        <CardContent className='flex-1 overflow-y-auto p-0'>
          <div className='max-w-4xl mx-auto w-full h-full p-4 md:p-6'>
            {messages.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center gap-6 text-center'>
                <div className='h-32 w-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-inner'>
                  <div className='relative h-12 w-12 bg-gray-800 dark:bg-gray-200 rounded-full eye-pupil'></div>
                </div>
                <p className='text-lg text-muted-foreground'>
                  Hãy chat cùng Dnote để tìm ra ý tưởng hay
                </p>
              </div>
            ) : (
              <div className='space-y-6'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-start gap-4',
                      message.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    )}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className='h-8 w-8 border'>
                        <AvatarFallback className='bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'>
                          <Bot className='h-5 w-5' />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'p-3 rounded-xl text-xl max-w-[85%]',
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80'
                      )}
                    >
                      {message.sender === 'bot' ? (
                        <BotMessage content={message.text} />
                      ) : (
                        <p className='text-xl'>{message.text}</p>
                      )}
                    </div>
                    {message.sender === 'user' && (
                      <Avatar className='h-8 w-8 border'>
                        <AvatarFallback>
                          <User className='h-5 w-5' />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading &&
                  messages[messages.length - 1]?.sender === 'bot' && (
                    <div className='flex items-start gap-4 justify-start'>
                      <Avatar className='h-8 w-8 border'>
                        <AvatarFallback className='bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'>
                          <Bot className='h-5 w-5' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='p-3 rounded-xl bg-muted/80 flex items-center space-x-1.5'>
                        <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]'></span>
                        <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]'></span>
                        <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce'></span>
                      </div>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className='p-2 border-t'>
          <div className='max-w-4xl mx-auto w-full p-2'>
            <form
              onSubmit={handleSendMessage}
              className='flex w-full items-end text-xl space-x-2'
            >
              <Textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ask anything...'
                disabled={isLoading}
                className='min-h-10 max-h-[200px] text-xl resize-none'
              />
              <Button
                type='submit'
                size='icon'
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className='h-4 w-4' />
              </Button>
            </form>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
