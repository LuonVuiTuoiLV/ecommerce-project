'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { deliverOrder, updateOrderToPaid } from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { cn, formatDateTime } from '@/lib/utils'
import ActionButton from '../action-button'
import ProductPrice from '../product/product-price'

export default function OrderDetailsForm({
  order,
  isAdmin,
}: {
  order: IOrder
  isAdmin: boolean
}) {
  const t = useTranslations('Order')
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
    couponCode,
    discountAmount,
  } = order

  return (
    <div className='grid md:grid-cols-3 md:gap-5'>
      <div className='overflow-x-auto md:col-span-2 space-y-4'>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>{t('Shipping Address')}</h2>
            <p className='font-semibold'>
              {shippingAddress.fullName}
            </p>
            <p className='text-muted-foreground'>
              {shippingAddress.phone}
            </p>
            <p>
              {shippingAddress.street}
            </p>
            <p>
              {shippingAddress.city}, {shippingAddress.province}, {shippingAddress.postalCode}
            </p>
            <p>
              {shippingAddress.country}
            </p>

            {isDelivered ? (
              <Badge className='mt-2'>
                {t('Delivered')} {formatDateTime(deliveredAt!).dateTime}
              </Badge>
            ) : (
              <div className='mt-2'>
                <Badge variant='destructive'>{t('Not Delivered')}</Badge>
                <p className='text-sm text-muted-foreground mt-1'>
                  {t('Expected')}: {formatDateTime(expectedDeliveryDate!).dateTime}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>{t('Payment Method')}</h2>
            <p>{paymentMethod}</p>
            {isPaid ? (
              <Badge>{t('Paid')} {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant='destructive'>{t('Not Paid')}</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4   gap-4'>
            <h2 className='text-xl pb-4'>{t('Order Items')}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Items')}</TableHead>
                  <TableHead>{t('Shipping')}</TableHead>
                  <TableHead>{t('Total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className='flex items-center'
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className='px-2'>{item.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>{item.quantity}</span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ProductPrice price={item.price} plain />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className='p-4  space-y-4 gap-4'>
            <h2 className='text-xl pb-4'>{t('Order Summary')}</h2>
            <div className='flex justify-between'>
              <div>{t('Items')}</div>
              <div>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </div>
            </div>
            {discountAmount > 0 && (
              <div className='flex justify-between text-green-600'>
                <div>{t('Discount')} {couponCode && `(${couponCode})`}</div>
                <div>
                  -<ProductPrice price={discountAmount} plain />
                </div>
              </div>
            )}
            <div className='flex justify-between'>
              <div>{t('Tax')}</div>
              <div>
                {' '}
                <ProductPrice price={taxPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>{t('Shipping')}</div>
              <div>
                {' '}
                <ProductPrice price={shippingPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>{t('Total')}</div>
              <div>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </div>
            </div>

            {!isPaid && ['Stripe', 'PayPal'].includes(paymentMethod) && (
              <Link
                className={cn(buttonVariants(), 'w-full')}
                href={`/checkout/${order._id}`}
              >
                {t('Pay Now')}
              </Link>
            )}

            {isAdmin && !isPaid && paymentMethod === 'Cash On Delivery' && (
              <ActionButton
                caption={t('Mark as Paid')}
                action={() => updateOrderToPaid(order._id)}
              />
            )}
            {isAdmin && isPaid && !isDelivered && (
              <ActionButton
                caption={t('Mark as Delivered')}
                action={() => deliverOrder(order._id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
