'use client'
import { ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import useSettingStore from '@/hooks/use-setting-store'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'

import { i18n } from '@/i18n-config'
import { usePathname, useRouter } from '@/i18n/routing'
import { setCurrencyOnServer } from '@/lib/actions/setting.actions'
import { SelectValue } from '@radix-ui/react-select'
import { useLocale, useTranslations } from 'next-intl'

// Map locale to currency
const localeCurrencyMap: Record<string, string> = {
  'vi': 'VND',
  'en-US': 'USD',
}

export default function Footer() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    setting: { site },
    setCurrency,
  } = useSettingStore()
  const { locales } = i18n

  const locale = useLocale()
  const t = useTranslations()

  const handleLanguageChange = async (newLocale: string) => {
    // Auto switch currency based on locale
    const newCurrency = localeCurrencyMap[newLocale] || 'VND'
    await setCurrencyOnServer(newCurrency)
    setCurrency(newCurrency)
    router.push(pathname, { locale: newLocale })
  }

  return (
    <footer className='bg-black text-white underline-link'>
      <div className='w-full'>
        {/* Back to top button */}
        <Button
          variant='ghost'
          className='bg-gray-800 w-full rounded-none hover:bg-gray-700'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUp className='mr-2 h-4 w-4' />
          {t('Footer.Back to top')}
        </Button>

        {/* Main footer content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 py-10'>
            <div className='text-center md:text-left'>
              <h3 className='font-bold mb-4 text-gray-100'>{t('Footer.Get to Know Us')}</h3>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <Link href='/page/careers' className='hover:text-white transition-colors'>
                    {t('Footer.Careers')}
                  </Link>
                </li>
                <li>
                  <Link href='/page/blog' className='hover:text-white transition-colors'>
                    {t('Footer.Blog')}
                  </Link>
                </li>
                <li>
                  <Link href='/page/about-us' className='hover:text-white transition-colors'>
                    {t('Footer.About name', { name: site.name })}
                  </Link>
                </li>
              </ul>
            </div>
            <div className='text-center md:text-left'>
              <h3 className='font-bold mb-4 text-gray-100'>{t('Footer.Make Money with Us')}</h3>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <Link href='/page/sell' className='hover:text-white transition-colors'>
                    {t('Footer.Sell products on', { name: site.name })}
                  </Link>
                </li>
                <li>
                  <Link href='/page/become-affiliate' className='hover:text-white transition-colors'>
                    {t('Footer.Become an Affiliate')}
                  </Link>
                </li>
                <li>
                  <Link href='/page/advertise' className='hover:text-white transition-colors'>
                    {t('Footer.Advertise Your Products')}
                  </Link>
                </li>
              </ul>
            </div>
            <div className='text-center md:text-left'>
              <h3 className='font-bold mb-4 text-gray-100'>{t('Footer.Let Us Help You')}</h3>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <Link href='/page/shipping' className='hover:text-white transition-colors'>
                    {t('Footer.Shipping Rates & Policies')}
                  </Link>
                </li>
                <li>
                  <Link href='/page/returns-policy' className='hover:text-white transition-colors'>
                    {t('Footer.Returns & Replacements')}
                  </Link>
                </li>
                <li>
                  <Link href='/page/help' className='hover:text-white transition-colors'>
                    {t('Footer.Help')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Logo and language selector */}
        <div className='border-t border-gray-800'>
          <div className='max-w-7xl mx-auto py-8 px-4'>
            <div className='flex flex-col items-center justify-center gap-4'>
              <div className='flex items-center gap-4'>
                <Image
                  src='/icons/logo.svg'
                  alt={`${site.name} logo`}
                  width={48}
                  height={48}
                  className='w-12 h-12'
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                <Select
                  value={locale}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className='w-auto min-w-[140px]'>
                    <SelectValue placeholder={t('Footer.Select a language')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((lang, index) => (
                      <SelectItem key={index} value={lang.code}>
                        <span className='flex items-center gap-2'>
                          <span className='text-lg'>{lang.icon}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className='bg-gray-900 py-6'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex flex-col items-center gap-3'>
            {/* Links */}
            <div className='flex flex-wrap justify-center gap-4 text-sm text-gray-400'>
              <Link href='/page/conditions-of-use' className='hover:text-white transition-colors'>
                {t('Footer.Conditions of Use')}
              </Link>
              <Link href='/page/privacy-policy' className='hover:text-white transition-colors'>
                {t('Footer.Privacy Notice')}
              </Link>
              <Link href='/page/help' className='hover:text-white transition-colors'>
                {t('Footer.Help')}
              </Link>
            </div>
            {/* Copyright */}
            <p className='text-sm text-gray-400'>© {site.copyright}</p>
            {/* Address */}
            <p className='text-sm text-gray-500 text-center'>
              {site.address} | {site.phone}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
