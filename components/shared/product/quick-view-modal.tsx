'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { IProduct } from '@/lib/db/models/product.model'
import { formatNumber, generateId, round2 } from '@/lib/utils'
import { Eye, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import ProductPrice from './product-price'
import Rating from './rating'
import WishlistButton from './wishlist-button'

// Color mapping - moved outside component to avoid recreation
const COLOR_MAP: Record<string, string> = {
  'Trắng': '#FFFFFF', 'Đen': '#000000', 'Đỏ': '#FF0000',
  'Xanh dương': '#0000FF', 'Xanh lá': '#00FF00', 'Vàng': '#FFFF00',
  'Cam': '#FFA500', 'Hồng': '#FFC0CB', 'Tím': '#800080',
  'Nâu': '#8B4513', 'Xám': '#808080', 'Xanh navy': '#000080',
  'Be': '#F5F5DC', 'Vàng gold': '#FFD700', 'Bạc': '#C0C0C0',
  'White': '#FFFFFF', 'Black': '#000000', 'Red': '#FF0000',
  'Blue': '#0000FF', 'Green': '#00FF00', 'Yellow': '#FFFF00',
  'Orange': '#FFA500', 'Pink': '#FFC0CB', 'Purple': '#800080',
  'Brown': '#8B4513', 'Gray': '#808080', 'Grey': '#808080',
  'Navy': '#000080', 'Beige': '#F5F5DC', 'Gold': '#FFD700', 'Silver': '#C0C0C0',
}

interface QuickViewModalProps {
  product: IProduct
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const { addItem } = useCartStore()

  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '')
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isAdding, setIsAdding] = useState(false)

  // Memoize cart item to avoid recreation
  const cartItem = useMemo(() => ({
    clientId: generateId(),
    product: product._id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: round2(product.price),
    quantity,
    image: product.images[0],
    countInStock: product.countInStock,
    size: selectedSize,
    color: selectedColor,
  }), [product, quantity, selectedSize, selectedColor])

  const handleAddToCart = useCallback(async () => {
    if (product.countInStock === 0) return
    
    setIsAdding(true)
    try {
      await addItem(cartItem, quantity)
      toast({
        description: t('Product.Added to Cart'),
        action: (
          <Button size="sm" onClick={() => router.push('/cart')}>
            {t('Product.Go to Cart')}
          </Button>
        ),
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Error',
      })
    } finally {
      setIsAdding(false)
    }
  }, [product.countInStock, cartItem, quantity, addItem, toast, t, router, onOpenChange])

  const handleBuyNow = useCallback(async () => {
    if (product.countInStock === 0) return
    
    try {
      await addItem(cartItem, quantity)
      router.push('/checkout')
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Error',
      })
    }
  }, [product.countInStock, cartItem, quantity, addItem, router, toast])

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity(prev => {
      const newVal = prev + delta
      return Math.max(1, Math.min(product.countInStock, newVal))
    })
  }, [product.countInStock])

  // Memoize stock status
  const stockStatus = useMemo(() => {
    if (product.countInStock === 0) return { inStock: false, text: t('Product.Out of Stock') }
    if (product.countInStock <= 5) return { 
      inStock: true, 
      text: t('Product.Only X left in stock - order soon', { count: product.countInStock }),
      isLow: true
    }
    return { inStock: true, text: t('Product.In Stock'), isLow: false }
  }, [product.countInStock, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="p-4 bg-muted/30">
            <div className="relative aspect-square mb-3">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {product.images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-14 h-14 border-2 rounded overflow-hidden transition-all ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-contain" sizes="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="p-4 md:p-6 flex flex-col">
            {/* Brand & Name */}
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            <Link 
              href={`/product/${product.slug}`} 
              className="font-bold text-lg hover:text-primary line-clamp-2 mb-2"
              onClick={() => onOpenChange(false)}
            >
              {product.name}
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <Rating rating={product.avgRating} size={4} />
              <span className="text-sm text-muted-foreground">
                ({formatNumber(product.numReviews)} {t('Product.reviews')})
              </span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <ProductPrice
                price={product.price}
                listPrice={product.listPrice}
                isDeal={product.tags.includes('todays-deal')}
              />
            </div>

            {/* Stock Status */}
            <p className={`text-sm mb-4 ${stockStatus.inStock ? 'text-green-600' : 'text-destructive'}`}>
              {stockStatus.text}
            </p>

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">{t('Product.Color')}: {selectedColor}</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm transition-all ${
                        selectedColor === color
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: COLOR_MAP[color] || color }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">{t('Product.Size')}: {selectedSize}</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[2.5rem] px-3 py-1.5 border rounded text-sm transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">{t('Product.Quantity')}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.countInStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button
                className="w-full rounded-full"
                onClick={handleAddToCart}
                disabled={!stockStatus.inStock || isAdding}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('Product.Add to Cart')}
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={handleBuyNow}
                disabled={!stockStatus.inStock}
              >
                {t('Product.Buy Now')}
              </Button>
              <div className="flex gap-2">
                <WishlistButton productId={product._id} variant="button" size="sm" className="flex-1" />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false)
                    router.push(`/product/${product.slug}`)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('Product.View Details')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick View Button Component - Memoized
export function QuickViewButton({ 
  product, 
  className = '' 
}: { 
  product: IProduct
  className?: string 
}) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }, [])

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className={`gap-1.5 ${className}`}
        onClick={handleClick}
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">{t('Product.Quick View')}</span>
      </Button>
      {open && <QuickViewModal product={product} open={open} onOpenChange={setOpen} />}
    </>
  )
}
