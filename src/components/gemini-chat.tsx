'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
        p: ({ node, ...props }) => <p className="text-sm mb-2 last:mb-0" {...props} />,
        ol: ({ node, ...props }) => <ol className="text-sm list-decimal list-inside" {...props} />,
        ul: ({ node, ...props }) => <ul className="text-sm list-disc list-inside" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user',
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: `bot-${Date.now()}`, text: '', sender: 'bot' },
    ])

    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
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
          sender: 'bot',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className='w-full h-full rounded-lg shadow-xl flex flex-col'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-lg flex items-center'>
          <Sparkles className='h-5 w-5 mr-2 text-purple-500' />
          Gemini Chat
        </CardTitle>
      </CardHeader>
      <CardContent className='flex-1 overflow-y-auto pr-2'>
        <div className='space-y-4'>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender === 'bot' && (
                <Avatar className='h-8 w-8'>
                  <AvatarFallback className='bg-purple-100 dark:bg-purple-900'>
                    <Bot className='h-5 w-5 text-purple-500' />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'p-2 rounded-lg max-w-[80%]',
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.sender === 'bot' ? (
                  <BotMessage content={message.text} />
                ) : (
                  <p className='text-sm'>{message.text}</p>
                )}
              </div>
              {message.sender === 'user' && (
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    <User className='h-5 w-5' />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className='flex items-start gap-3 justify-start'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback className='bg-purple-100 dark:bg-purple-900'>
                  <Bot className='h-5 w-5 text-purple-500' />
                </AvatarFallback>
              </Avatar>
              <div className='p-2 rounded-lg bg-muted flex items-center space-x-1'>
                <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]'></span>
                <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]'></span>
                <span className='h-2 w-2 bg-purple-500 rounded-full animate-bounce'></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={handleSendMessage}
          className='flex w-full space-x-2'
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Ask me anything...'
            disabled={isLoading}
          />
          <Button type='submit' size='icon' disabled={isLoading}>
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
