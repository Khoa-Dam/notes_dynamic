'use client'

import { useEffect, useState } from 'react'
import { File } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { useSearch } from '@/hooks/use-search'
import { useDebounce } from '@/hooks/use-debounce'
import { Spinner } from './spinner'

type Document = {
  _id: string
  title: string
  icon?: string | null
  workspaceId: string
}

export const SearchCommand = () => {
  const { data: session } = useSession()
  const user = session?.user
  const router = useRouter()

  const [isMounted, setIsMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  const toggle = useSearch((store) => store.toggle)
  const isOpen = useSearch((store) => store.isOpen)
  const onClose = useSearch((store) => store.onClose)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (debouncedQuery.length === 0) {
        setDocuments([])
        return
      }
      setIsFetching(true)
      try {
        const response = await fetch(`/api/search?q=${debouncedQuery}`)
        if (response.ok) {
          const data = await response.json()
          console.log('data', data)
          setDocuments(data)
        } else {
          setDocuments([])
        }
      } catch (error) {
        console.error('Failed to fetch documents', error)
        setDocuments([])
      } finally {
        setIsFetching(false)
      }
    }

    if (isOpen) {
      fetchDocuments()
    }
  }, [debouncedQuery, isOpen])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  // Reset query when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  const onSelect = (id: string, workspaceId: string) => {
    router.push(`/dashboard/${workspaceId}/${id}`) // Assuming this is the correct path
    onClose()
  }

  if (!isMounted) {
    return null
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput
        placeholder={`Search ${user?.name || 'your'}'s Dnote...`}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isFetching && (
          <div className='flex items-center justify-center p-4'>
            <Spinner size='lg' />
          </div>
        )}
        {!isFetching && documents.length === 0 && query.length > 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        <CommandGroup heading='Documents'>
          {documents.map((document) => (
            <CommandItem
              key={document._id}
              value={`${document._id}-${document.title}`}
              title={document.title}
              onSelect={() => onSelect(document._id, document.workspaceId)}
            >
              {document.icon ? (
                <p className='mr-2 text-[18px]'>{document.icon}</p>
              ) : (
                <File className='mr-2 h-4 w-4' />
              )}
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
