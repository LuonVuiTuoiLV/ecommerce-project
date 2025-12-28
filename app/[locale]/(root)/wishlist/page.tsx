import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { getWishlist } from '@/lib/actions/wishlist.actions'
import { Heart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import WishlistItems from './wishlist-items'

export async function generateMetadata() {
  const t = await getTranslations('Wishlist')
  return {
    title: t('My Wishlist'),
  }
}

export default async function WishlistPage() {
  const t = await getTranslations('Wishlist')
  const session = await auth()

  // If not logged in, show message to sign in
  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="h1-bold mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('My Wishlist')}
        </h1>
        <div className="text-center py-16">
          <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground mb-4">
            {t('Sign in to view wishlist')}
          </p>
          <Link href="/sign-in">
            <Button>{t('Sign In')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const result = await getWishlist()
  const wishlistItems = result.data || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="h1-bold mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
        <span className="text-xl sm:text-2xl md:text-3xl">
          {t('My Wishlist')} ({wishlistItems.length} {t('items')})
        </span>
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground mb-4">
            {t('Wishlist is empty')}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('Start adding products')}
          </p>
          <Link href="/search">
            <Button>{t('Browse Products')}</Button>
          </Link>
        </div>
      ) : (
        <WishlistItems items={wishlistItems} />
      )}
    </div>
  )
}
