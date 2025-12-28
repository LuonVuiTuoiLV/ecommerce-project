'use client'

import { getFilterUrl } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

interface PriceRange {
  value: string
  minUSD: number
  maxUSD: number
}

// Price ranges in USD (database values)
const PRICE_RANGES: PriceRange[] = [
  { value: '1-20', minUSD: 1, maxUSD: 20 },
  { value: '21-50', minUSD: 21, maxUSD: 50 },
  { value: '51-1000', minUSD: 51, maxUSD: 1000 },
]

// VND convert rate
const VND_RATE = 24500

export default function PriceFilter({
  price,
  params,
}: {
  price: string
  params: {
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }
}) {
  const t = useTranslations('Search')
  const locale = useLocale()
  const isVN = locale === 'vi'

  // Format price based on locale
  const formatPrice = (usdValue: number) => {
    if (isVN) {
      const vndValue = usdValue * VND_RATE
      return new Intl.NumberFormat('vi-VN').format(vndValue) + 'đ'
    }
    return '$' + usdValue
  }

  // Get display text for price range
  const getPriceRangeText = (range: PriceRange) => {
    return `${formatPrice(range.minUSD)} - ${formatPrice(range.maxUSD)}`
  }

  return (
    <div>
      <div className='font-bold text-base mb-3 pb-2 border-b'>{t('Price')}</div>
      <ul className='space-y-2'>
        <li>
          <Link
            className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
              'all' === price ? 'bg-primary/10 text-primary font-medium' : ''
            }`}
            href={getFilterUrl({ price: 'all', params })}
          >
            {t('All')}
          </Link>
        </li>
        {PRICE_RANGES.map((range) => (
          <li key={range.value}>
            <Link
              href={getFilterUrl({ price: range.value, params })}
              className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors text-sm ${
                range.value === price ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
            >
              {getPriceRangeText(range)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
