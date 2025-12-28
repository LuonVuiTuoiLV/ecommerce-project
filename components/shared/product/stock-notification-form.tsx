'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { subscribeStockNotification } from '@/lib/actions/stock-notification.actions'
import { Bell, BellOff, Check, Loader2, Mail } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState, useTransition } from 'react'

// Email regex - moved outside to avoid recreation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface StockNotificationFormProps {
  productId: string
  productName: string
  productSlug: string
  variant?: 'inline' | 'card'
}

export default function StockNotificationForm({
  productId,
  productName,
  productSlug,
  variant = 'inline',
}: StockNotificationFormProps) {
  const t = useTranslations('Product')
  const { toast } = useToast()
  const { data: session } = useSession()
  const [email, setEmail] = useState(session?.user?.email || '')
  const [isPending, startTransition] = useTransition()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Memoize validation
  const isValidEmail = useMemo(() => EMAIL_REGEX.test(email), [email])

  const handleSubscribe = useCallback(() => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast({
        variant: 'destructive',
        description: t('Please enter your email'),
      })
      return
    }

    if (!isValidEmail) {
      toast({
        variant: 'destructive',
        description: t('Please enter a valid email'),
      })
      return
    }

    startTransition(async () => {
      const result = await subscribeStockNotification({
        email: trimmedEmail,
        productId,
        productName,
        productSlug,
      })

      if (result.success) {
        setIsSubscribed(true)
        toast({
          description: t('You will be notified when this product is back in stock'),
        })
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }, [email, isValidEmail, productId, productName, productSlug, t, toast])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleShowForm = useCallback(() => setShowForm(true), [])
  const handleHideForm = useCallback(() => setShowForm(false), [])

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${variant === 'card' ? 'p-4 bg-green-50 dark:bg-green-950 rounded-lg' : ''}`}>
        <Check className="h-5 w-5" />
        <span className="text-sm font-medium">{t('Subscribed for notification')}</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-primary" />
          <span className="font-medium">{t('Get notified when back in stock')}</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder={t('Enter your email')}
              value={email}
              onChange={handleEmailChange}
              className="pl-9"
              disabled={isPending}
              autoComplete="email"
            />
          </div>
          <Button 
            onClick={handleSubscribe} 
            disabled={isPending || !email.trim()}
            type="button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('Notify Me')
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t('We will send you an email when this product is available')}
        </p>
      </div>
    )
  }

  // Inline variant
  if (!showForm) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleShowForm}
        type="button"
      >
        <Bell className="h-4 w-4" />
        {t('Notify when available')}
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t('Enter your email')}
          value={email}
          onChange={handleEmailChange}
          disabled={isPending}
          className="flex-1"
          autoComplete="email"
        />
        <Button 
          onClick={handleSubscribe} 
          disabled={isPending || !email.trim()} 
          size="icon"
          type="button"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHideForm}
          disabled={isPending}
          type="button"
        >
          <BellOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
