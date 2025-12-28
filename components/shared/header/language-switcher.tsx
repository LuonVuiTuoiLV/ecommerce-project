'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import useSettingStore from '@/hooks/use-setting-store'
import { i18n } from '@/i18n-config'
import { usePathname, useRouter } from '@/i18n/routing'
import { setCurrencyOnServer } from '@/lib/actions/setting.actions'
import { ChevronDownIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

// Map locale to currency
const localeCurrencyMap: Record<string, string> = {
  'vi': 'VND',
  'en-US': 'USD',
}

export default function LanguageSwitcher() {
  const t = useTranslations('Footer')
  const { locales } = i18n
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { setCurrency } = useSettingStore()

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale || isPending) return
    
    // Auto switch currency based on locale
    const newCurrency = localeCurrencyMap[newLocale] || 'VND'
    
    // Update currency on server first (set cookie)
    await setCurrencyOnServer(newCurrency)
    
    // Update local state
    setCurrency(newCurrency)
    
    // Then navigate
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='header-button h-[41px]' disabled={isPending}>
        <div className='flex items-center gap-1'>
          <span className='text-xl'>
            {locales.find((l) => l.code === locale)?.icon}
          </span>
          {locale.toUpperCase().slice(0, 2)}
          <ChevronDownIcon className={isPending ? 'animate-spin' : ''} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>{t('Select a language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale}>
          {locales.map((c) => (
            <DropdownMenuRadioItem 
              key={c.name} 
              value={c.code}
              onClick={() => handleLanguageChange(c.code)}
              className='cursor-pointer'
              disabled={isPending}
            >
              <span className='text-lg mr-2'>{c.icon}</span> {c.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
