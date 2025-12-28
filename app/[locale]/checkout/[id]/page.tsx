import { notFound } from 'next/navigation'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import Stripe from 'stripe'
import PaymentForm from './payment-form'

export async function generateMetadata() {
  const t = await getTranslations('Checkout')
  return {
    title: t('Payment Method'),
  }
}

const CheckoutPaymentPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()
  const { availablePaymentMethods } = await getSetting()

  // Find the payment method details
  const paymentMethodInfo = availablePaymentMethods.find(
    (pm) => pm.name === order.paymentMethod
  )

  let client_secret = null
  if (order.paymentMethod === 'Stripe' && !order.isPaid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'USD',
      metadata: { orderId: order._id },
    })
    client_secret = paymentIntent.client_secret
  }
  return (
    <PaymentForm
      order={order}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      clientSecret={client_secret}
      isAdmin={session?.user?.role === 'Admin' || false}
      paymentMethodInfo={paymentMethodInfo}
    />
  )
}

export default CheckoutPaymentPage
