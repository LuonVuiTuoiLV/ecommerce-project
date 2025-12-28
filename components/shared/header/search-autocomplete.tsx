'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Clock, Search, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface SearchResult {
  _id: string
  name: string
  slug: string
  images: string[]
  price: number
  category: string
}

interface SearchAutocompleteProps {
  placeholder: string
  category?: string
}

const SEARCH_HISTORY_KEY = 'search-history'
const MAX_HISTORY = 5
const DEBOUNCE_MS = 300

export default function SearchAutocomplete({
  placeholder,
  category = 'all',
}: SearchAutocompleteProps) {
  const t = useTranslations('Search')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load search history from localStorage (only on mount)
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (history) {
        setSearchHistory(JSON.parse(history))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save search to history
  const saveToHistory = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return

    setSearchHistory(prev => {
      const newHistory = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
      } catch {
        // Ignore localStorage errors
      }
      return newHistory
    })
  }, [])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Fetch search results with abort controller
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const params = new URLSearchParams({ q: searchQuery, limit: '5' })
      if (category !== 'all') {
        params.set('category', category)
      }

      const res = await fetch(`/api/products/search?${params}`, {
        signal: abortControllerRef.current.signal,
      })
      const data = await res.json()
      setResults(data.products || [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [category])

  // Debounced search with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query)
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query, fetchResults])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle search navigation
  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return
    saveToHistory(searchTerm)
    const params = new URLSearchParams({ q: searchTerm })
    if (category !== 'all') {
      params.set('category', category)
    }
    router.push(`/search?${params}`)
    setIsOpen(false)
    setQuery('')
  }, [category, router, saveToHistory])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = results.length + (query.length < 2 ? searchHistory.length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (query.length < 2 && selectedIndex < searchHistory.length) {
            handleSearch(searchHistory[selectedIndex])
          } else if (results[selectedIndex]) {
            router.push(`/product/${results[selectedIndex].slug}`)
            setIsOpen(false)
          }
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }, [results, query, searchHistory, selectedIndex, handleSearch, router])

  // Memoize dropdown visibility
  const showDropdown = useMemo(() => 
    isOpen && (query.length >= 2 ? results.length > 0 : searchHistory.length > 0),
    [isOpen, query.length, results.length, searchHistory.length]
  )

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelectedIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="rounded-none dark:border-gray-200 bg-gray-100 text-black text-base h-full pr-8"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* Search History */}
          {query.length < 2 && searchHistory.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('Recent searches')}
                </span>
                <button
                  onClick={clearHistory}
                  className="hover:text-destructive transition-colors"
                  type="button"
                >
                  {t('Clear')}
                </button>
              </div>
              {searchHistory.map((term, idx) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent rounded transition-colors',
                    selectedIndex === idx && 'bg-accent'
                  )}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query.length >= 2 && results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {t('Suggestions')}
              </div>
              {results.map((product, idx) => (
                <button
                  key={product._id}
                  onClick={() => {
                    router.push(`/product/${product.slug}`)
                    setIsOpen(false)
                    setQuery('')
                  }}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded transition-colors',
                    selectedIndex === idx && 'bg-accent'
                  )}
                >
                  <div className="relative w-10 h-10 shrink-0 bg-muted rounded">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain rounded"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => handleSearch(query)}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent rounded mt-1 transition-colors"
              >
                <Search className="h-4 w-4" />
                {t('Search for')} &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
