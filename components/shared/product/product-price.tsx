'use client'
import useSettingStore from '@/hooks/use-setting-store'
import { cn, round2 } from '@/lib/utils'
import { useFormatter, useTranslations } from 'next-intl'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
}: {
  price: number
  isDeal?: boolean
  listPrice?: number
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()
  const convertedPrice = Math.round(currency.convertRate * price)
  const convertedListPrice = Math.round(currency.convertRate * listPrice)

  const format = useFormatter()
  const discountPercent = Math.round(
    100 - (convertedPrice / convertedListPrice) * 100
  )

  // For VND, don't show decimals
  const isVND = currency.code === 'VND'

  // Format price with proper currency display
  const formatPriceDisplay = (value: number) => {
    if (isVND) {
      // Format VND: 2.008.755 ₫
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        currencyDisplay: 'symbol',
        maximumFractionDigits: 0,
      }).format(value)
    }
    // Format USD: $80.35
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(round2(value))
  }

  // Price component for consistent styling
  const PriceDisplay = ({ value, size = 'lg' }: { value: number; size?: 'lg' | 'sm' }) => {
    if (isVND) {
      const formatted = new Intl.NumberFormat('vi-VN').format(value)
      return (
        <span className={cn(
          'inline-flex items-baseline gap-0.5',
          size === 'lg' ? 'text-3xl' : 'text-xl',
          className
        )}>
          <span className='font-semibold'>{formatted}</span>
          <span className={cn(
            'font-normal text-current',
            size === 'lg' ? 'text-xl' : 'text-base'
          )}>₫</span>
        </span>
      )
    }
    // For USD and other currencies
    return (
      <span className={cn(size === 'lg' ? 'text-3xl' : 'text-xl', className)}>
        <span className='text-xs align-super'>{currency.symbol}</span>
        {round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    )
  }

  return plain ? (
    format.number(convertedPrice, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: isVND ? 0 : 2,
    })
  ) : convertedListPrice == 0 ? (
    <div className={cn('', className)}>
      <PriceDisplay value={convertedPrice} />
    </div>
  ) : isDeal ? (
    <div className='space-y-2'>
      <div className='flex justify-center items-center gap-2'>
        <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
          {discountPercent}% {t('Product.Off')}
        </span>
        <span className='text-red-700 text-xs font-bold'>
          {t('Product.Limited time deal')}
        </span>
      </div>
      <div
        className={`flex ${forListing && 'justify-center'} items-center gap-2`}
      >
        <PriceDisplay value={convertedPrice} />
        <div className='text-muted-foreground text-xs py-2'>
          {t('Product.Was')}:{' '}
          <span className='line-through'>
            {formatPriceDisplay(convertedListPrice)}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <div className=''>
      <div className='flex justify-center items-baseline gap-2'>
        <div className='text-2xl font-semibold text-orange-700'>-{discountPercent}%</div>
        <PriceDisplay value={convertedPrice} />
      </div>
      <div className='text-muted-foreground text-xs py-2 text-center'>
        {t('Product.List price')}:{' '}
        <span className='line-through'>
          {formatPriceDisplay(convertedListPrice)}
        </span>
      </div>
    </div>
  )
}

export default ProductPrice
