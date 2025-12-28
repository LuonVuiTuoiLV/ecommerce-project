'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
    approvePayPalOrder,
    createPayPalOrder,
} from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'
import {
    PayPalButtons,
    PayPalScriptProvider,
    usePayPalScriptReducer,
} from '@paypal/react-paypal-js'
import { useTranslations } from 'next-intl'

import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { redirect, useRouter } from 'next/navigation'
import CheckoutFooter from '../checkout-footer'
import StripeForm from './stripe-form'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
)
export default function OrderDetailsForm({
  order,
  paypalClientId,
  clientSecret,
  paymentMethodInfo,
}: {
  order: IOrder
  paypalClientId: string
  isAdmin: boolean
  clientSecret: string | null
  paymentMethodInfo?: {
    name: string
    commission: number
    bankName?: string
    bankAccountNumber?: string
    bankAccountName?: string
    description?: string
  }
}) {
  const router = useRouter()
  const t = useTranslations()
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
    couponCode,
    discountAmount,
  } = order
  const { toast } = useToast()

  if (isPaid) {
    redirect(`/account/orders/${order._id}`)
  }
  function PrintLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    let status = ''
    if (isPending) {
      status = t('Loading.Loading')
    } else if (isRejected) {
      status = t('Error.Error')
    }
    return status
  }
  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order._id)
    if (!res.success)
      return toast({
        description: res.message,
        variant: 'destructive',
      })
    return res.data
  }
  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order._id, data)
    toast({
      description: res.message,
      variant: res.success ? 'default' : 'destructive',
    })
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        <div>
          <div className='text-lg font-bold'>{t('Checkout.Order Summary')}</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>{t('Checkout.Items')}:</span>
              <span>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            {discountAmount > 0 && (
              <div className='flex justify-between text-green-600'>
                <span>{t('Checkout.Discount')} {couponCode && `(${couponCode})`}:</span>
                <span>
                  -<ProductPrice price={discountAmount} plain />
                </span>
              </div>
            )}
            <div className='flex justify-between'>
              <span>{t('Checkout.Shipping & Handling')}:</span>
              <span>
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  t('Checkout.FREE')
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>{t('Checkout.Tax')}:</span>
              <span>
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between  pt-1 font-bold text-lg'>
              <span>{t('Checkout.Order Total')}:</span>
              <span>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>

            {!isPaid && paymentMethod === 'PayPal' && (
              <div>
                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                  <PrintLoadingState />
                  <PayPalButtons
                    createOrder={handleCreatePayPalOrder}
                    onApprove={handleApprovePayPalOrder}
                  />
                </PayPalScriptProvider>
              </div>
            )}
            {!isPaid && paymentMethod === 'Stripe' && clientSecret && (
              <Elements
                options={{
                  clientSecret,
                }}
                stripe={stripePromise}
              >
                <StripeForm
                  priceInCents={Math.round(order.totalPrice * 100)}
                  orderId={order._id}
                />
              </Elements>
            )}

            {!isPaid && paymentMethod === 'Cash On Delivery' && (
              <Button
                className='w-full rounded-full'
                onClick={() => router.push(`/account/orders/${order._id}`)}
              >
                {t('Order.Order Details')}
              </Button>
            )}

            {!isPaid && paymentMethod === 'Bank Transfer' && (
              <div className='space-y-3 border rounded-lg p-4 bg-muted/30'>
                <p className='font-semibold text-sm'>{t('Checkout.Bank Transfer Info')}</p>
                <div className='text-sm space-y-1'>
                  <p><span className='text-muted-foreground'>{t('Checkout.Bank Name')}:</span> <strong>{paymentMethodInfo?.bankName || 'N/A'}</strong></p>
                  <p><span className='text-muted-foreground'>{t('Checkout.Account Number')}:</span> <strong>{paymentMethodInfo?.bankAccountNumber || 'N/A'}</strong></p>
                  <p><span className='text-muted-foreground'>{t('Checkout.Account Name')}:</span> <strong>{paymentMethodInfo?.bankAccountName || 'N/A'}</strong></p>
                  <p><span className='text-muted-foreground'>{t('Checkout.Transfer Content')}:</span> <strong>DH{order._id.slice(-8).toUpperCase()}</strong></p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {t('Checkout.Bank Transfer Note')}
                </p>
                <Button
                  className='w-full rounded-full'
                  onClick={() => router.push(`/account/orders/${order._id}`)}
                >
                  {t('Order.Order Details')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className='max-w-6xl mx-auto'>
      <div className='grid md:grid-cols-4 gap-6'>
        <div className='md:col-span-3'>
          {/* Shipping Address */}
          <div>
            <div className='grid md:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold'>
                <span>{t('Checkout.Shipping address')}</span>
              </div>
              <div className='col-span-2'>
                <p>
                  {shippingAddress.fullName} <br />
                  {shippingAddress.street} <br />
                  {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                </p>
              </div>
            </div>
          </div>

          {/* payment method */}
          <div className='border-y'>
            <div className='grid md:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold'>
                <span>{t('Checkout.Payment Method')}</span>
              </div>
              <div className='col-span-2'>
                <p>{paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className='grid md:grid-cols-3 my-3 pb-3'>
            <div className='flex text-lg font-bold'>
              <span>{t('Checkout.Items and shipping')}</span>
            </div>
            <div className='col-span-2'>
              <p>
                {t('Checkout.Delivery date')}:
                {formatDateTime(expectedDeliveryDate).dateOnly}
              </p>
              <ul>
                {items.map((item) => (
                  <li key={item.slug}>
                    {item.name} x {item.quantity} = <ProductPrice price={item.price} plain />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='block md:hidden'>
            <CheckoutSummary />
          </div>

          <CheckoutFooter />
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
