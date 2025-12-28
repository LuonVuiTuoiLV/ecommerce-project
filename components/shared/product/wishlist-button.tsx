'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import useWishlistStore from '@/hooks/use-wishlist-store'
import { toggleWishlist } from '@/lib/actions/wishlist.actions'
import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

interface WishlistButtonProps {
  productId: string
  className?: string
  variant?: 'icon' | 'button'
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({
  productId,
  className,
  variant = 'icon',
  size = 'md',
}: WishlistButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const t = useTranslations('Wishlist')
  const [isPending, startTransition] = useTransition()

  const {
    isInWishlist,
    toggleLocalWishlist,
    setServerWishlist,
    serverWishlist,
  } = useWishlistStore()

  const isWishlisted = isInWishlist(productId)
  const [optimisticWishlisted, setOptimisticWishlisted] = useState(isWishlisted)

  // Sync optimistic state with actual state when it changes
  useEffect(() => {
    setOptimisticWishlisted(isWishlisted)
  }, [isWishlisted])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      // Guest user - use local storage
      const added = toggleLocalWishlist(productId)
      setOptimisticWishlisted(added)
      toast({
        description: added ? t('Added to Wishlist') : t('Removed from Wishlist'),
      })
      return
    }

    // Logged in user - use server action
    setOptimisticWishlisted(!optimisticWishlisted)

    startTransition(async () => {
      const result = await toggleWishlist(productId)

      if (result.success) {
        // Update server wishlist in store
        if (result.action === 'added') {
          setServerWishlist([...serverWishlist, productId])
          toast({
            description: t('Added to Wishlist'),
          })
        } else if (result.action === 'removed') {
          setServerWishlist(serverWishlist.filter((id) => id !== productId))
          toast({
            description: t('Removed from Wishlist'),
          })
        }
      } else {
        // Revert optimistic update
        setOptimisticWishlisted(!optimisticWishlisted)
        toast({
          variant: 'destructive',
          description: result.message,
        })

        if (result.message?.includes('sign in')) {
          router.push('/sign-in')
        }
      }
    })
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={cn('gap-2', className)}
      >
        <Heart
          className={cn(
            sizeClasses[size],
            optimisticWishlisted && 'fill-red-500 text-red-500'
          )}
        />
        {optimisticWishlisted ? t('Remove from Wishlist') : t('Add to Wishlist')}
      </Button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isPending && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={optimisticWishlisted ? t('Remove from Wishlist') : t('Add to Wishlist')}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-colors duration-200',
          optimisticWishlisted
            ? 'fill-red-500 text-red-500'
            : 'text-gray-600 hover:text-red-500'
        )}
      />
    </button>
  )
}
