import {
    LinkAuthenticationElement,
    PaymentElement,
    useElements,
    useStripe,
} from '@stripe/react-stripe-js'
import { AlertCircle, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'

import ProductPrice from '@/components/shared/product/product-price'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import useSettingStore from '@/hooks/use-setting-store'

export default function StripeForm({
  priceInCents,
  orderId,
}: {
  priceInCents: number
  orderId: string
}) {
  const t = useTranslations('Checkout')
  const {
    setting: { site },
  } = useSettingStore()

  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [email, setEmail] = useState<string>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (stripe == null || elements == null || email == null) return

    setIsLoading(true)
    setErrorMessage(undefined)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${site.url}/checkout/${orderId}/stripe-payment-success`,
        },
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message)
        } else {
          setErrorMessage(t('An unknown error occurred'))
        }
      }
    } catch {
      setErrorMessage(t('An unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='flex items-center gap-2 text-lg font-semibold'>
        <Lock className='h-5 w-5 text-green-600' />
        {t('Stripe Checkout')}
      </div>

      {errorMessage && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <div>
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
      </div>

      <Button
        className='w-full'
        size='lg'
        disabled={stripe == null || elements == null || isLoading || !email}
      >
        {isLoading ? (
          <span className='flex items-center gap-2'>
            <Loader2 className='h-4 w-4 animate-spin' />
            {t('Processing payment')}
          </span>
        ) : (
          <span className='flex items-center gap-2'>
            <ShieldCheck className='h-4 w-4' />
            {t('Pay')} <ProductPrice price={priceInCents / 100} plain />
          </span>
        )}
      </Button>

      <p className='text-xs text-center text-muted-foreground'>
        {t('Your payment is secured by Stripe')}
      </p>
    </form>
  )
}
