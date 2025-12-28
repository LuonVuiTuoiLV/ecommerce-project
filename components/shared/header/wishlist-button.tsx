'use client'

import useIsMounted from '@/hooks/use-is-mounted'
import useWishlistStore from '@/hooks/use-wishlist-store'
import { getWishlistProductIds } from '@/lib/actions/wishlist.actions'
import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HeaderWishlistButton() {
  const { data: session } = useSession()
  const isMounted = useIsMounted()
  const t = useTranslations('Wishlist')

  const {
    localWishlist,
    serverWishlist,
    setServerWishlist,
    isInitialized,
    setInitialized,
  } = useWishlistStore()

  const [isLoading, setIsLoading] = useState(false)

  // Fetch server wishlist when user logs in
  useEffect(() => {
    const fetchServerWishlist = async () => {
      if (session?.user?.id && !isInitialized) {
        setIsLoading(true)
        try {
          const productIds = await getWishlistProductIds()
          setServerWishlist(productIds)
          setInitialized(true)
        } catch (error) {
          console.error('Error fetching wishlist:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchServerWishlist()
  }, [session?.user?.id, isInitialized, setServerWishlist, setInitialized])

  // Calculate count
  const count = session?.user
    ? serverWishlist.length
    : localWishlist.length

  return (
    <Link href="/wishlist" className="px-1 header-button">
      <div className="flex items-end text-xs relative">
        <Heart className="h-8 w-8" />
        {isMounted && count > 0 && (
          <span
            className={cn(
              'bg-black px-1 rounded-full text-primary text-base font-bold absolute left-[10px] top-[-4px] z-10',
              count >= 10 && 'text-sm px-0 p-[1px]'
            )}
          >
            {isLoading ? '...' : count}
          </span>
        )}
        <span className="font-bold">{t('Wishlist')}</span>
      </div>
    </Link>
  )
}
