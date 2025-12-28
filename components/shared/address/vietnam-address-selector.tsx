'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    getProvinces,
    getWards,
    Province,
    Ward,
} from '@/lib/vietnam-address'
import { AlertCircle, Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VietnamAddressSelectorProps {
  provinceCode?: number
  wardCode?: number
  onProvinceChange: (code: number, name: string) => void
  onWardChange: (code: number, name: string) => void
  disabled?: boolean
}

export default function VietnamAddressSelector({
  provinceCode,
  wardCode,
  onProvinceChange,
  onWardChange,
  disabled = false,
}: VietnamAddressSelectorProps) {
  const t = useTranslations('Account')
  
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [errorProvinces, setErrorProvinces] = useState(false)
  
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [wardOpen, setWardOpen] = useState(false)
  
  const [provinceSearch, setProvinceSearch] = useState('')
  const [wardSearch, setWardSearch] = useState('')

  const provinceContainerRef = useRef<HTMLDivElement>(null)
  const wardContainerRef = useRef<HTMLDivElement>(null)
  
  // Track if provinces have been fetched
  const provincesFetched = useRef(false)

  const selectedProvince = provinces.find(p => p.code === provinceCode)
  const selectedWard = wards.find(w => w.code === wardCode)

  // Filter provinces by search
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return provinces
    const search = provinceSearch.toLowerCase()
    return provinces.filter(p => p.name.toLowerCase().includes(search))
  }, [provinces, provinceSearch])

  // Filter wards by search
  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) return wards
    const search = wardSearch.toLowerCase()
    return wards.filter(w => w.name.toLowerCase().includes(search))
  }, [wards, wardSearch])

  // Fetch provinces ONCE on mount
  useEffect(() => {
    if (provincesFetched.current) return
    provincesFetched.current = true
    
    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      setErrorProvinces(false)
      try {
        const data = await getProvinces()
        setProvinces(data)
        setErrorProvinces(data.length === 0)
      } catch {
        setErrorProvinces(true)
      } finally {
        setLoadingProvinces(false)
      }
    }
    
    fetchProvinces()
  }, [])

  // Fetch wards when province changes
  useEffect(() => {
    if (!provinceCode) {
      setWards([])
      return
    }

    let cancelled = false

    const fetchWardsData = async () => {
      setLoadingWards(true)
      try {
        const data = await getWards(provinceCode)
        if (!cancelled) {
          setWards(data)
        }
      } finally {
        if (!cancelled) {
          setLoadingWards(false)
        }
      }
    }
    
    fetchWardsData()
    return () => { cancelled = true }
  }, [provinceCode])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      
      if (provinceOpen && provinceContainerRef.current && !provinceContainerRef.current.contains(target)) {
        setProvinceOpen(false)
        setProvinceSearch('')
      }
      
      if (wardOpen && wardContainerRef.current && !wardContainerRef.current.contains(target)) {
        setWardOpen(false)
        setWardSearch('')
      }
    }

    // Use click instead of mousedown to allow button clicks to complete first
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [provinceOpen, wardOpen])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProvinceOpen(false)
        setWardOpen(false)
        setProvinceSearch('')
        setWardSearch('')
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleProvinceSelect = useCallback((province: Province) => {
    onProvinceChange(province.code, province.name)
    onWardChange(0, '')
    setProvinceOpen(false)
    setProvinceSearch('')
  }, [onProvinceChange, onWardChange])

  const handleWardSelect = useCallback((ward: Ward) => {
    onWardChange(ward.code, ward.name)
    setWardOpen(false)
    setWardSearch('')
  }, [onWardChange])

  return (
    <div className='space-y-4'>
      {errorProvinces && (
        <div className='flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg'>
          <AlertCircle className='h-4 w-4 flex-shrink-0' />
          <span>{t('Unable to load address data')}</span>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {/* Province/City */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            {t('Province/City')} <span className='text-destructive'>*</span>
          </label>
          <div ref={provinceContainerRef} className='relative'>
            <Button
              type='button'
              variant='outline'
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled && !loadingProvinces) {
                  setProvinceOpen(prev => !prev)
                  setWardOpen(false)
                }
              }}
              className='w-full h-10 justify-between font-normal'
              disabled={disabled || loadingProvinces}
            >
              {loadingProvinces ? (
                <span className='flex items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('Loading')}
                </span>
              ) : selectedProvince ? (
                <span className='truncate text-left'>{selectedProvince.name}</span>
              ) : (
                <span className='text-muted-foreground'>{t('Select province')}</span>
              )}
              <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200', provinceOpen && 'rotate-180')} />
            </Button>

            {provinceOpen && (
              <div 
                className='absolute z-[100] top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='flex items-center border-b px-3'>
                  <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                  <input
                    type='text'
                    placeholder={t('Search province')}
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className='h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
                    autoFocus
                  />
                  {provinceSearch && (
                    <button 
                      type='button' 
                      onClick={(e) => {
                        e.stopPropagation()
                        setProvinceSearch('')
                      }} 
                      className='p-1 hover:bg-accent rounded'
                    >
                      <X className='h-4 w-4 opacity-50' />
                    </button>
                  )}
                </div>
                <div className='max-h-[180px] overflow-y-auto overscroll-contain'>
                  {filteredProvinces.length === 0 ? (
                    <div className='py-6 text-center text-sm text-muted-foreground'>
                      {t('No results found')}
                    </div>
                  ) : (
                    <div className='p-1'>
                      {filteredProvinces.map((province) => (
                        <div
                          key={province.code}
                          role='option'
                          aria-selected={provinceCode === province.code}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleProvinceSelect(province)
                          }}
                          className={cn(
                            'relative flex w-full items-center rounded-sm px-2 py-2 text-sm cursor-pointer text-left',
                            'hover:bg-accent hover:text-accent-foreground transition-colors',
                            provinceCode === province.code && 'bg-accent'
                          )}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 flex-shrink-0',
                              provinceCode === province.code ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>{province.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ward/Commune */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            {t('Ward/Commune')} <span className='text-destructive'>*</span>
          </label>
          <div ref={wardContainerRef} className='relative'>
            <Button
              type='button'
              variant='outline'
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled && provinceCode && !loadingWards) {
                  setWardOpen(prev => !prev)
                  setProvinceOpen(false)
                }
              }}
              className='w-full h-10 justify-between font-normal'
              disabled={disabled || !provinceCode || loadingWards}
            >
              {loadingWards ? (
                <span className='flex items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('Loading')}
                </span>
              ) : selectedWard ? (
                <span className='truncate text-left'>{selectedWard.name}</span>
              ) : (
                <span className='text-muted-foreground'>
                  {!provinceCode ? t('Select province first') : t('Select ward')}
                </span>
              )}
              <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200', wardOpen && 'rotate-180')} />
            </Button>

            {wardOpen && (
              <div 
                className='absolute z-[100] top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='flex items-center border-b px-3'>
                  <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                  <input
                    type='text'
                    placeholder={t('Search ward')}
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className='h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
                    autoFocus
                  />
                  {wardSearch && (
                    <button 
                      type='button' 
                      onClick={(e) => {
                        e.stopPropagation()
                        setWardSearch('')
                      }} 
                      className='p-1 hover:bg-accent rounded'
                    >
                      <X className='h-4 w-4 opacity-50' />
                    </button>
                  )}
                </div>
                <div className='max-h-[180px] overflow-y-auto overscroll-contain'>
                  {filteredWards.length === 0 ? (
                    <div className='py-6 text-center text-sm text-muted-foreground'>
                      {t('No results found')}
                    </div>
                  ) : (
                    <div className='p-1'>
                      {filteredWards.map((ward) => (
                        <div
                          key={ward.code}
                          role='option'
                          aria-selected={wardCode === ward.code}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleWardSelect(ward)
                          }}
                          className={cn(
                            'relative flex w-full items-center rounded-sm px-2 py-2 text-sm cursor-pointer text-left',
                            'hover:bg-accent hover:text-accent-foreground transition-colors',
                            wardCode === ward.code && 'bg-accent'
                          )}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 flex-shrink-0',
                              wardCode === ward.code ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>{ward.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
