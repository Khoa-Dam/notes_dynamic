'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, X, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// CSS for the animated eye, injected into the document head
const eyeAnimationStyle = `
  @keyframes move-eye {
    0%, 100% { transform: translate(30%, -20%); }
    10% { transform: translate(30%, -20%); }
    20% { transform: translate(-30%, -20%); }
    30% { transform: translate(-30%, -20%); }
    40% { transform: translate(0%, 25%); }
    50% { transform: translate(0%, 25%); }
    60% { transform: translate(30%, -20%); }
    70% { transform: translate(30%, -20%); }
    80% { transform: translate(-30%, 20%); }
    90% { transform: translate(-30%, 20%); }
  }
  .eye-pupil {
    animation: move-eye 8s ease-in-out infinite;
  }
`

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
}

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user'
    }

    // Add user message and a placeholder for the bot's response
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
        body: JSON.stringify({ messages: [...messages, userMessage] }) // Send the up-to-date history
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
        ...prev.slice(0, -1), // Remove the empty bot message
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className='absolute bottom-20 left-100 right-59 z-50'
          >
            <Card className='w-100 h-120 rounded-lg shadow-xl flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-lg flex items-center'>
                  <Sparkles className='h-5 w-5 mr-2 text-purple-500' />
                  Idea Assistant
                </CardTitle>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsOpen(false)}
                  className='h-8 w-8'
                >
                  <X className='h-4 w-4' />
                </Button>
              </CardHeader>
              <CardContent className='flex-1 overflow-y-auto pr-2'>
                <div className='space-y-4'>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-start gap-3',
                        message.sender === 'user'
                          ? 'justify-end'
                          : 'justify-start'
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
                    placeholder='Ask for ideas...'
                    disabled={isLoading}
                  />
                  <Button type='submit' size='icon' disabled={isLoading}>
                    <Send className='h-4 w-4' />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed bottom-4 left-120 z-40 h-16 w-16 rounded-full shadow-lg transition-transform duration-300 hover:scale-110',
          isOpen && 'scale-0'
        )}
        aria-label='Toggle Chatbot'
      >
        <div className='h-8 w-8 bg-white rounded-full flex items-center justify-center overflow-hidden'>
          <div className='relative h-4 w-4 bg-gray-800 rounded-full eye-pupil'></div>
        </div>
        <span className='sr-only'>Toggle AI Assistant</span>
      </Button>
    </>
  )
}
