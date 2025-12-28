'use client'

import ProductPrice from '@/components/shared/product/product-price'
import Rating from '@/components/shared/product/rating'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import useWishlistStore from '@/hooks/use-wishlist-store'
import { removeFromWishlist } from '@/lib/actions/wishlist.actions'
import { generateId, round2 } from '@/lib/utils'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface WishlistProduct {
  _id: string
  name: string
  slug: string
  images: string[]
  price: number
  listPrice: number
  countInStock: number
  brand: string
  category: string
  avgRating: number
  numReviews: number
  tags: string[]
  sizes: string[]
  colors: string[]
}

interface WishlistItem {
  product: WishlistProduct
  addedAt: string
}

export default function WishlistItems({ items }: { items: WishlistItem[] }) {
  const t = useTranslations('Wishlist')
  const tProduct = useTranslations('Product')
  const { toast } = useToast()
  const router = useRouter()
  const { addItem } = useCartStore()
  const { setServerWishlist, serverWishlist } = useWishlistStore()
  const [isPending, startTransition] = useTransition()

  const handleRemove = async (productId: string) => {
    startTransition(async () => {
      const result = await removeFromWishlist(productId)
      if (result.success) {
        setServerWishlist(serverWishlist.filter((id) => id !== productId))
        toast({ description: t('Removed from Wishlist') })
        router.refresh()
      } else {
        toast({ variant: 'destructive', description: t('Failed to remove') })
      }
    })
  }

  const handleAddToCart = async (product: WishlistProduct) => {
    try {
      await addItem(
        {
          clientId: generateId(),
          product: product._id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: 1,
          image: product.images[0],
          countInStock: product.countInStock,
          size: product.sizes[0] || '',
          color: product.colors[0] || '',
        },
        1
      )
      toast({
        description: tProduct('Added to Cart'),
        action: (
          <Button onClick={() => router.push('/cart')}>
            {tProduct('Go to Cart')}
          </Button>
        ),
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Error adding to cart',
      })
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const product = item.product
        if (!product) return null

        return (
          <Card key={product._id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Product Image */}
                <Link href={`/product/${product.slug}`} className="shrink-0 self-center sm:self-start">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain rounded"
                      sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg hover:text-primary line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {product.brand}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <Rating rating={product.avgRating} size={3} />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      ({product.numReviews})
                    </span>
                  </div>

                  <div className="mt-2">
                    <ProductPrice
                      price={product.price}
                      listPrice={product.listPrice}
                      isDeal={product.tags?.includes('todays-deal')}
                      forListing
                    />
                  </div>

                  {/* Stock Status */}
                  <p
                    className={`text-xs sm:text-sm mt-1 ${
                      product.countInStock > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {product.countInStock > 0
                      ? tProduct('In Stock')
                      : tProduct('Out of Stock')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.countInStock === 0 || isPending}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="sm:hidden md:inline">{t('Add to Cart')}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(product._id)}
                    disabled={isPending}
                    className="gap-2 flex-1 sm:flex-none text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sm:hidden md:inline">{t('Remove')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
