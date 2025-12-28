import { auth } from '@/auth'
import CheckoutErrorBoundary from '@/components/shared/checkout-error-boundary'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import CheckoutForm from './checkout-form'

export async function generateMetadata() {
  const t = await getTranslations('Cart')
  return {
    title: t('Checkout'),
  }
}

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/checkout')
  }
  return (
    <CheckoutErrorBoundary>
      <CheckoutForm />
    </CheckoutErrorBoundary>
  )
}
