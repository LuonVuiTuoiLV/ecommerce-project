'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Eye, ShieldCheck, Truck, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

interface SocialProofProps {
  productId: string
  numSales?: number
  showViewers?: boolean
  showTrustBadges?: boolean
  variant?: 'compact' | 'full'
}

// Generate consistent hash from productId
const getBaseViewers = (productId: string): number => {
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return (hash % 15) + 2 // 2-16 viewers
}

export default function SocialProof({
  productId,
  numSales = 0,
  showViewers = true,
  showTrustBadges = true,
  variant = 'full',
}: SocialProofProps) {
  const t = useTranslations('Product')
  const [viewers, setViewers] = useState(() => getBaseViewers(productId))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate real-time viewers fluctuation
  useEffect(() => {
    // Reset viewers when productId changes
    setViewers(getBaseViewers(productId))

    // Simulate fluctuation
    intervalRef.current = setInterval(() => {
      setViewers((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1
        return Math.max(1, Math.min(20, prev + change))
      })
    }, 30000) // Update every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [productId])

  // Memoize formatted sales count
  const formattedSales = useMemo(() => {
    if (numSales <= 10) return null
    return numSales > 1000 ? `${(numSales / 1000).toFixed(1)}k+` : `${numSales}+`
  }, [numSales])

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {showViewers && viewers > 0 && (
          <span className="flex items-center gap-1 text-orange-600">
            <Eye className="h-4 w-4" />
            {viewers} {t('people viewing')}
          </span>
        )}
        {formattedSales && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {formattedSales} {t('sold')}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Live Viewers */}
      {showViewers && viewers > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-orange-600 font-medium">
            {viewers} {t('people are viewing this right now')}
          </span>
        </div>
      )}

      {/* Sales Count */}
      {formattedSales && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {formattedSales} {t('sold this month')}
          </span>
        </div>
      )}

      {/* Trust Badges */}
      {showTrustBadges && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <ShieldCheck className="h-3 w-3 text-green-600" />
            {t('Secure Payment')}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Truck className="h-3 w-3 text-blue-600" />
            {t('Fast Delivery')}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {t('Quality Guaranteed')}
          </Badge>
        </div>
      )}
    </div>
  )
}
