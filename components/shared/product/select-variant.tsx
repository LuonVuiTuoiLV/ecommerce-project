import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

// Color mapping from Vietnamese to hex codes
const colorMap: Record<string, string> = {
  // Vietnamese
  'Trắng': '#FFFFFF',
  'Đen': '#000000',
  'Đỏ': '#FF0000',
  'Xanh dương': '#0000FF',
  'Xanh lá': '#00FF00',
  'Vàng': '#FFFF00',
  'Cam': '#FFA500',
  'Hồng': '#FFC0CB',
  'Tím': '#800080',
  'Nâu': '#8B4513',
  'Xám': '#808080',
  'Xanh navy': '#000080',
  'Be': '#F5F5DC',
  'Vàng gold': '#FFD700',
  'Bạc': '#C0C0C0',
  // English
  'White': '#FFFFFF',
  'Black': '#000000',
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#00FF00',
  'Yellow': '#FFFF00',
  'Orange': '#FFA500',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Brown': '#8B4513',
  'Gray': '#808080',
  'Grey': '#808080',
  'Navy': '#000080',
  'Beige': '#F5F5DC',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
}

export default async function SelectVariant({
  product,
  size,
  color,
}: {
  product: IProduct
  color: string
  size: string
}) {
  const t = await getTranslations('Product')
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  return (
    <>
      {product.colors.length > 0 && (
        <div className='space-y-2'>
          <div className='font-medium'>{t('Color')}:</div>
          <div className='flex flex-wrap gap-2'>
            {product.colors.map((x: string) => (
              <Button
                asChild
                variant='outline'
                className={`${
                  selectedColor === x ? 'border-2 border-primary ring-2 ring-primary/20' : 'border'
                }`}
                key={x}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: x,
                    size: selectedSize,
                  })}`}
                  key={x}
                >
                  <div
                    style={{ backgroundColor: colorMap[x] || x }}
                    className='h-5 w-5 rounded-full border-2 border-muted-foreground mr-2'
                  ></div>
                  {x}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
      {product.sizes.length > 0 && (
        <div className='mt-4 space-y-2'>
          <div className='font-medium'>{t('Size')}:</div>
          <div className='flex flex-wrap gap-2'>
            {product.sizes.map((x: string) => (
              <Button
                asChild
                variant='outline'
                className={`min-w-[3rem] ${
                  selectedSize === x ? 'border-2 border-primary ring-2 ring-primary/20' : 'border'
                }`}
                key={x}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: selectedColor,
                    size: x,
                  })}`}
                >
                  {x}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
