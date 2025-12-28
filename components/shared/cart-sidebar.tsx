import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import { getDirection } from '@/i18n-config'
import { cn } from '@/lib/utils'
import { TrashIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { Button, buttonVariants } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Separator } from '../ui/separator'
import ProductPrice from './product/product-price'

export default function CartSidebar() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()

  const locale = useLocale()
  return (
    <div className='w-full sm:w-40 md:w-48 lg:w-56 overflow-y-auto'>
      <div
        className={`w-full sm:w-40 md:w-48 lg:w-56 fixed h-full ${
          getDirection(locale) === 'rtl' ? 'border-r' : 'border-l'
        }`}
      >
        <div className='p-3 sm:p-4 h-full flex flex-col gap-3'>
          <div className='text-center space-y-2'>
            <div className='text-sm font-medium'>{t('Cart.Subtotal')}</div>
            <div className='font-bold text-lg'>
              <ProductPrice price={itemsPrice} plain />
            </div>
            {itemsPrice > freeShippingMinPrice && (
              <div className='text-center text-xs text-muted-foreground'>
                {t('Cart.Your order qualifies for FREE Shipping')}
              </div>
            )}

            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'rounded-full hover:no-underline w-full text-xs sm:text-sm whitespace-nowrap'
              )}
              href='/cart'
            >
              {t('Cart.Go to Cart')}
            </Link>
            <Separator className='mt-3' />
          </div>

          <ScrollArea className='flex-1 w-full'>
            {items.map((item) => (
              <div key={item.clientId}>
                <div className='my-3'>
                  <Link href={`/product/${item.slug}`}>
                    <div className='relative h-20 sm:h-24'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='20vw'
                        className='object-contain'
                      />
                    </div>
                  </Link>
                  <div className='text-xs sm:text-sm text-center font-bold mt-2'>
                    <ProductPrice price={item.price} plain />
                  </div>
                  <div className='flex gap-2 mt-2 justify-center'>
                    <Select
                      value={item.quantity.toString()}
                      onValueChange={(value) => {
                        updateItem(item, Number(value))
                      }}
                    >
                      <SelectTrigger className='text-xs w-12 h-8'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: item.countInStock }).map(
                          (_, i) => (
                            <SelectItem value={(i + 1).toString()} key={i + 1}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={'outline'}
                      size={'sm'}
                      className='h-8 w-8 p-0'
                      onClick={() => {
                        removeItem(item)
                      }}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
