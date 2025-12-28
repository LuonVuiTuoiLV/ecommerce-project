'use client'

import ProductPrice from '@/components/shared/product/product-price'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { getAvailableCoupons, validateCoupon } from '@/lib/actions/coupon.actions'
import { formatDateTime } from '@/lib/utils'
import { ChevronDown, Loader2, Percent, Ticket } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

interface AvailableCoupon {
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  potentialDiscount: number
  isApplicable: boolean
  endDate: string | Date
}

export default function AvailableCoupons() {
  const t = useTranslations('Coupon')
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [applyingCode, setApplyingCode] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const {
    cart: { itemsPrice, coupon: appliedCoupon, items },
    applyCoupon,
  } = useCartStore()

  // Memoize categories to avoid recalculation
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items]
  )

  // Fetch available coupons when opened (only once)
  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true
      setIsLoading(true)
      getAvailableCoupons(itemsPrice, categories)
        .then((result) => {
          if (result.success) {
            setCoupons(result.data)
          }
        })
        .catch(() => {
          // Silently handle error
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, itemsPrice, categories])

  // Reset fetch flag when cart changes significantly
  useEffect(() => {
    hasFetched.current = false
  }, [itemsPrice])

  const handleApplyCoupon = useCallback((code: string) => {
    setApplyingCode(code)
    startTransition(async () => {
      const result = await validateCoupon(code, itemsPrice, categories)

      if (result.success && result.data) {
        applyCoupon(result.data)
        toast({
          description: t('Coupon applied successfully'),
        })
        setIsOpen(false)
      } else {
        toast({
          variant: 'destructive',
          description: result.message || t('Invalid coupon'),
        })
      }
      setApplyingCode(null)
    })
  }, [itemsPrice, categories, applyCoupon, toast, t])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  // Don't show if coupon already applied
  if (appliedCoupon) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
          type="button"
        >
          <span className="flex items-center gap-2 text-sm text-primary">
            <Ticket className="h-4 w-4" />
            {t('View available coupons')}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {t('No coupons available')}
          </p>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className={`border rounded-lg p-3 ${
                  coupon.isApplicable
                    ? 'bg-background'
                    : 'bg-muted/50 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {coupon.code}
                      </code>
                      {coupon.discountType === 'percentage' ? (
                        <Badge variant="secondary" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {coupon.discountValue}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <ProductPrice price={coupon.discountValue} plain />
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {coupon.description}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {coupon.minOrderValue > 0 && (
                        <span>
                          {t('Min order')}: <ProductPrice price={coupon.minOrderValue} plain />
                        </span>
                      )}
                      <span>
                        {t('Expires')}: {formatDateTime(new Date(coupon.endDate)).dateOnly}
                      </span>
                    </div>
                    {coupon.isApplicable && coupon.potentialDiscount > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        {t('You save')}: <ProductPrice price={coupon.potentialDiscount} plain />
                      </p>
                    )}
                    {!coupon.isApplicable && (
                      <p className="text-xs text-orange-600 mt-1">
                        {t('Add more to qualify', { amount: coupon.minOrderValue - itemsPrice })}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={coupon.isApplicable ? 'default' : 'outline'}
                    disabled={!coupon.isApplicable || isPending}
                    onClick={() => handleApplyCoupon(coupon.code)}
                    className="shrink-0"
                    type="button"
                  >
                    {applyingCode === coupon.code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('Apply')
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
