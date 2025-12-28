'use client'

import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { validateCoupon } from '@/lib/actions/coupon.actions'
import { Loader2, Tag, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import AvailableCoupons from './available-coupons'

export default function CouponInput() {
  const t = useTranslations('Coupon')
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [isPending, startTransition] = useTransition()

  const {
    cart: { itemsPrice, coupon, items },
    applyCoupon,
    removeCoupon,
  } = useCartStore()

  const handleApplyCoupon = () => {
    if (!code.trim()) {
      toast({
        variant: 'destructive',
        description: t('Please enter a coupon code'),
      })
      return
    }

    startTransition(async () => {
      // Get categories from cart items
      const categories = [...new Set(items.map((item) => item.category))]

      const result = await validateCoupon(code, itemsPrice, categories)

      if (result.success && result.data) {
        applyCoupon(result.data)
        toast({
          description: t('Coupon applied successfully'),
        })
        setCode('')
      } else {
        toast({
          variant: 'destructive',
          description: t('Invalid coupon'),
        })
      }
    })
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    toast({
      description: t('Coupon removed'),
    })
  }

  if (coupon) {
    return (
      <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                {coupon.code}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {coupon.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-700 dark:text-green-400 font-medium">
              -<ProductPrice price={coupon.discountAmount} plain />
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="h-6 w-6 p-0 text-green-700 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Enter coupon code')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pl-9"
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleApplyCoupon()
              }
            }}
          />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isPending || !code.trim()}
          variant="outline"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('Apply')
          )}
        </Button>
      </div>
      <AvailableCoupons />
    </div>
  )
}
