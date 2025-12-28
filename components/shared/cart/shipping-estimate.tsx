'use client'

import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useSettingStore from '@/hooks/use-setting-store'
import { ChevronDown, Loader2, MapPin, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState, useTransition } from 'react'

interface ShippingEstimateProps {
  itemsPrice: number
}

interface ShippingEstimateResult {
  shippingPrice: number
  deliveryDays: string
  isFree: boolean
}

export default function ShippingEstimate({ itemsPrice }: ShippingEstimateProps) {
  const t = useTranslations('Cart')
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [postalCode, setPostalCode] = useState('')
  const [estimate, setEstimate] = useState<ShippingEstimateResult | null>(null)

  const {
    setting: {
      common: { freeShippingMinPrice },
      availableDeliveryDates,
    },
  } = useSettingStore()

  // Memoize amount needed for free shipping
  const amountForFreeShipping = useMemo(
    () => Math.max(0, freeShippingMinPrice - itemsPrice),
    [freeShippingMinPrice, itemsPrice]
  )

  const handleEstimate = useCallback(() => {
    if (!postalCode.trim()) return

    startTransition(() => {
      // Simulate shipping calculation based on delivery dates settings
      const standardDelivery = availableDeliveryDates[0]
      const isFree = itemsPrice >= freeShippingMinPrice

      setEstimate({
        shippingPrice: isFree ? 0 : standardDelivery?.shippingPrice || 30000,
        deliveryDays: `${standardDelivery?.daysToDeliver || 3}-${(standardDelivery?.daysToDeliver || 3) + 2}`,
        isFree,
      })
    })
  }, [postalCode, availableDeliveryDates, itemsPrice, freeShippingMinPrice])

  const handlePostalCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEstimate()
    }
  }, [handleEstimate])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent text-sm"
          type="button"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            {t('Estimate shipping')}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform text-muted-foreground ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-sm">
            {t('Postal Code')}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="postalCode"
                placeholder={t('Enter postal code')}
                value={postalCode}
                onChange={handlePostalCodeChange}
                className="pl-9"
                onKeyDown={handleKeyDown}
                autoComplete="postal-code"
              />
            </div>
            <Button
              onClick={handleEstimate}
              disabled={isPending || !postalCode.trim()}
              size="sm"
              type="button"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('Calculate')
              )}
            </Button>
          </div>
        </div>

        {estimate && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('Standard Shipping')}</span>
              <span className={`font-medium ${estimate.isFree ? 'text-green-600' : ''}`}>
                {estimate.isFree ? (
                  t('FREE')
                ) : (
                  <ProductPrice price={estimate.shippingPrice} plain />
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('Estimated delivery')}</span>
              <span>{estimate.deliveryDays} {t('days')}</span>
            </div>
            {!estimate.isFree && amountForFreeShipping > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('Add')} <ProductPrice price={amountForFreeShipping} plain /> {t('more for free shipping')}
              </p>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
