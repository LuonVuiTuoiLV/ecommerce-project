'use client'

import CouponInput from '@/components/shared/checkout/coupon-input'
import SavedAddresses from '@/components/shared/checkout/saved-addresses'
import ProductPrice from '@/components/shared/product/product-price'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useCartStore from '@/hooks/use-cart-store'
import useIsMounted from '@/hooks/use-is-mounted'
import useSettingStore from '@/hooks/use-setting-store'
import { useToast } from '@/hooks/use-toast'
import { createOrder } from '@/lib/actions/order.actions'
import { calculateFutureDate, formatDateTime } from '@/lib/utils'
import { ShippingAddressSchema } from '@/lib/validator'
import { ShippingAddress } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import CheckoutFooter from './checkout-footer'

// Types for cart validation
interface InvalidItem {
  productId: string
  name: string
  reason: 'not_found' | 'not_published' | 'insufficient_stock'
}

const shippingAddressDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        fullName: 'Nguyễn Văn A',
        street: '123 Nguyễn Huệ',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        phone: '0901234567',
        postalCode: '700000',
        country: 'Việt Nam',
      }
    : {
        fullName: '',
        street: '',
        city: '',
        province: '',
        phone: '',
        postalCode: '',
        country: 'Việt Nam',
      }

const CheckoutForm = () => {
  const t = useTranslations('Checkout')
  const { toast } = useToast()
  const router = useRouter()
  const {
    setting: {
      site,
      availablePaymentMethods,
      defaultPaymentMethod,
      availableDeliveryDates,
    },
  } = useSettingStore()

  const {
    cart: {
      items,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      shippingAddress,
      deliveryDateIndex,
      paymentMethod = defaultPaymentMethod,
      coupon,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    clearCart,
    setDeliveryDateIndex,
  } = useCartStore()
  const isMounted = useIsMounted()

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  })

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = useCallback(
    (values) => {
      setShippingAddress(values)
      setIsAddressSelected(true)
    },
    [setShippingAddress]
  )

  useEffect(() => {
    if (!isMounted || !shippingAddress) return
    shippingAddressForm.setValue('fullName', shippingAddress.fullName)
    shippingAddressForm.setValue('street', shippingAddress.street)
    shippingAddressForm.setValue('city', shippingAddress.city)
    shippingAddressForm.setValue('country', shippingAddress.country)
    shippingAddressForm.setValue('postalCode', shippingAddress.postalCode)
    shippingAddressForm.setValue('province', shippingAddress.province)
    shippingAddressForm.setValue('phone', shippingAddress.phone)
  }, [items, isMounted, router, shippingAddress, shippingAddressForm])

  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] = useState<boolean>(false)
  const [isDeliveryDateSelected, setIsDeliveryDateSelected] = useState<boolean>(false)
  const [addressTab, setAddressTab] = useState<'saved' | 'new'>('saved')
  
  // Loading and confirmation states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Cart validation states
  const [invalidItems, setInvalidItems] = useState<InvalidItem[]>([])

  // Validate cart items on mount and when items change
  useEffect(() => {
    const validateCart = async () => {
      if (!isMounted || items.length === 0) {
        setInvalidItems([])
        return
      }
      
      try {
        const response = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        })
        
        const result = await response.json()
        if (result.success && result.data.invalidItems) {
          setInvalidItems(result.data.invalidItems)
        }
      } catch (error) {
        console.error('Cart validation error:', error)
      }
    }
    
    validateCart()
  }, [isMounted, items])

  // Remove invalid item from cart
  const handleRemoveInvalidItem = useCallback((productId: string) => {
    const itemToRemove = items.find(item => item.product === productId)
    if (itemToRemove) {
      removeItem(itemToRemove)
      setInvalidItems(prev => prev.filter(item => item.productId !== productId))
      toast({
        description: t('Item removed from cart'),
        variant: 'default',
      })
    }
  }, [items, removeItem, toast, t])

  // Check if there are invalid items
  const hasInvalidItems = invalidItems.length > 0

  const handlePlaceOrder = useCallback(async () => {
    // Check for invalid items first
    if (hasInvalidItems) {
      toast({
        description: t('Please remove invalid items before placing order'),
        variant: 'destructive',
      })
      return
    }
    
    // Prevent double submission
    if (isPlacingOrder) return
    
    setIsPlacingOrder(true)
    setShowConfirmDialog(false)

    try {
      const res = await createOrder(
        {
          items,
          shippingAddress,
          expectedDeliveryDate: calculateFutureDate(
            availableDeliveryDates[deliveryDateIndex!].daysToDeliver
          ),
          deliveryDateIndex,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
        },
        coupon?.code
      )

      if (!res.success) {
        toast({
          description: res.message,
          variant: 'destructive',
        })
      } else {
        toast({
          description: res.message,
          variant: 'default',
        })
        clearCart()
        router.push(`/checkout/${res.data?.orderId}`)
      }
    } catch {
      toast({
        description: t('An error occurred while placing your order'),
        variant: 'destructive',
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }, [
    hasInvalidItems,
    isPlacingOrder,
    items,
    shippingAddress,
    availableDeliveryDates,
    deliveryDateIndex,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    coupon,
    toast,
    clearCart,
    router,
    t,
  ])

  const handleConfirmOrder = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  const handleSelectPaymentMethod = useCallback(() => {
    setIsAddressSelected(true)
    setIsPaymentMethodSelected(true)
  }, [])

  const handleSelectShippingAddress = useCallback(() => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)()
  }, [shippingAddressForm, onSubmitShippingAddress])

  const handleSelectSavedAddress = useCallback(
    (address: ShippingAddress) => {
      setShippingAddress(address)
    },
    [setShippingAddress]
  )

  const handleUseSavedAddress = useCallback(() => {
    if (shippingAddress) {
      setIsAddressSelected(true)
    }
  }, [shippingAddress])


  // Order button with loading state
  const OrderButton = ({ className = '' }: { className?: string }) => (
    <Button
      onClick={handleConfirmOrder}
      className={`rounded-full ${className}`}
      disabled={isPlacingOrder || !shippingAddress || items.length === 0}
    >
      {isPlacingOrder ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          {t('Processing')}
        </>
      ) : (
        t('Place Your Order')
      )}
    </Button>
  )

  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        {!isAddressSelected && (
          <div className='border-b mb-4'>
            <Button
              className='rounded-full w-full'
              onClick={handleSelectShippingAddress}
            >
              {t('Ship to this address')}
            </Button>
            <p className='text-xs text-center py-2'>
              {t('Choose a shipping address')}
            </p>
          </div>
        )}
        {isAddressSelected && !isPaymentMethodSelected && (
          <div className='mb-4'>
            <Button
              className='rounded-full w-full'
              onClick={handleSelectPaymentMethod}
            >
              {t('Use this payment method')}
            </Button>
            <p className='text-xs text-center py-2'>
              {t('Choose a payment method')}
            </p>
          </div>
        )}
        {isPaymentMethodSelected && isAddressSelected && (
          <div>
            <OrderButton className='w-full' />
            <p className='text-xs text-center py-2'>
              {site.name}{' '}
              <Link href='/page/privacy-policy' className='text-primary hover:underline'>
                {t('privacy notice')}
              </Link>{' '}
              <Link href='/page/conditions-of-use' className='text-primary hover:underline'>
                {t('conditions of use')}
              </Link>
              .
            </p>
          </div>
        )}

        <div>
          <div className='text-lg font-bold'>{t('Order Summary')}</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>{t('Items')}:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            {coupon && (
              <div className='flex justify-between text-green-600'>
                <span>{t('Discount')}:</span>
                <span>
                  -<ProductPrice price={coupon.discountAmount} plain />
                </span>
              </div>
            )}
            <div className='flex justify-between'>
              <span>{t('Shipping & Handling')}:</span>
              <span>
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  t('FREE')
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>{t('Tax')}:</span>
              <span>
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between pt-4 font-bold text-lg'>
              <span>{t('Order Total')}:</span>
              <span>
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
            <div className='pt-4 border-t space-y-3'>
              <CouponInput />
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className='mt-4 pt-4 border-t'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <ShieldCheck className='h-4 w-4 text-green-600' />
            <span>{t('Secure checkout')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-primary' />
              {t('Confirm Order')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-3'>
                <p>{t('Please review your order before confirming')}</p>
                <div className='bg-muted p-3 rounded-lg text-sm space-y-2'>
                  <div className='flex justify-between'>
                    <span>{t('Items')}:</span>
                    <span>{items.length} {t('products')}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{t('Shipping to')}:</span>
                    <span className='text-right'>{shippingAddress?.city}, {shippingAddress?.province}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{t('Payment')}:</span>
                    <span>{paymentMethod}</span>
                  </div>
                  <div className='flex justify-between font-bold pt-2 border-t'>
                    <span>{t('Total')}:</span>
                    <span><ProductPrice price={totalPrice} plain /></span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPlacingOrder}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className='gap-2'
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('Processing')}
                </>
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4' />
                  {t('Confirm Order')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className='max-w-6xl mx-auto highlight-link'>
        {/* Invalid Items Warning */}
        {invalidItems.length > 0 && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>{t('Invalid items in cart')}</AlertTitle>
            <AlertDescription>
              <div className='mt-2 space-y-2'>
                {invalidItems.map((item) => (
                  <div key={item.productId} className='flex items-center justify-between bg-destructive/10 p-2 rounded'>
                    <div>
                      <span className='font-medium'>{item.name}</span>
                      <span className='text-sm ml-2'>
                        ({item.reason === 'not_found' 
                          ? t('Product not found') 
                          : item.reason === 'not_published' 
                            ? t('Product unavailable')
                            : t('Insufficient stock')})
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveInvalidItem(item.productId)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-4 w-4 mr-1' />
                      {t('Remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className='grid md:grid-cols-4 gap-6'>
          <div className='md:col-span-3'>
            {/* shipping address */}
            <div>
              {isAddressSelected && shippingAddress ? (
                <div className='grid grid-cols-1 md:grid-cols-12 my-3 pb-3'>
                  <div className='col-span-5 flex text-lg font-bold'>
                    <span className='w-8'>1 </span>
                    <span>{t('Shipping address')}</span>
                  </div>
                  <div className='col-span-5'>
                    <p>
                      {shippingAddress.fullName} <br />
                      {shippingAddress.street} <br />
                      {`${shippingAddress.city ? shippingAddress.city + ', ' : ''}${shippingAddress.province}${shippingAddress.postalCode ? ', ' + shippingAddress.postalCode : ''}, ${shippingAddress.country}`}
                    </p>
                    {shippingAddress.phone && (
                      <p className='text-sm text-muted-foreground mt-1'>
                        {t('Phone number')}: {shippingAddress.phone}
                      </p>
                    )}
                  </div>
                  <div className='col-span-2 flex flex-col gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setIsAddressSelected(false)
                        setAddressTab('new')
                        // Pre-fill form with current address for editing
                        shippingAddressForm.reset(shippingAddress)
                      }}
                    >
                      {t('Edit')}
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setIsAddressSelected(false)
                        setAddressTab('saved')
                      }}
                    >
                      {t('Change')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='flex text-primary text-lg font-bold my-2'>
                    <span className='w-8'>1 </span>
                    <span>{t('Enter shipping address')}</span>
                  </div>
                  <Card className='md:ml-8 my-4'>
                    <CardContent className='p-4'>
                      <Tabs
                        value={addressTab}
                        onValueChange={(v) => setAddressTab(v as 'saved' | 'new')}
                      >
                        <TabsList className='grid w-full grid-cols-2 mb-4'>
                          <TabsTrigger value='saved'>
                            {t('Saved addresses')}
                          </TabsTrigger>
                          <TabsTrigger value='new'>{t('New address')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value='saved'>
                          <SavedAddresses
                            onSelectAddress={handleSelectSavedAddress}
                            onAddNew={() => setAddressTab('new')}
                            selectedAddress={shippingAddress}
                          />
                          {shippingAddress && (
                            <div className='mt-4'>
                              <Button
                                onClick={handleUseSavedAddress}
                                className='rounded-full font-bold w-full'
                              >
                                {t('Ship to this address')}
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value='new'>
                          <Form {...shippingAddressForm}>
                            <form
                              method='post'
                              onSubmit={shippingAddressForm.handleSubmit(
                                onSubmitShippingAddress
                              )}
                              className='space-y-4'
                            >
                              <div className='text-lg font-bold mb-2'>
                                {t('Your address')}
                              </div>

                              <div className='flex flex-col gap-5 md:flex-row'>
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='fullName'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Full Name')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter full name')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div>
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='street'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Address')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter address')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className='flex flex-col gap-5 md:flex-row'>
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='city'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('City')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter city')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='province'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Province')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter province')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='country'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Country')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter country')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className='flex flex-col gap-5 md:flex-row'>
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='postalCode'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Postal Code')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter postal code')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name='phone'
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormLabel>{t('Phone number')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={t('Enter phone number')}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <Button
                                type='submit'
                                className='rounded-full font-bold w-full'
                              >
                                {t('Ship to this address')}
                              </Button>
                            </form>
                          </Form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* payment method */}
            <div className='border-y'>
              {isPaymentMethodSelected && paymentMethod ? (
                <div className='grid grid-cols-1 md:grid-cols-12 my-3 pb-3'>
                  <div className='flex text-lg font-bold col-span-5'>
                    <span className='w-8'>2 </span>
                    <span>{t('Payment Method')}</span>
                  </div>
                  <div className='col-span-5'>
                    <p className='font-semibold'>{paymentMethod}</p>
                    {paymentMethod === 'Bank Transfer' && (() => {
                      const bankInfo = availablePaymentMethods.find(pm => pm.name === 'Bank Transfer')
                      return bankInfo ? (
                        <div className='mt-2 text-sm text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg'>
                          <p><span className='font-medium'>{t('Bank Name')}:</span> {bankInfo.bankName || 'N/A'}</p>
                          <p><span className='font-medium'>{t('Account Number')}:</span> {bankInfo.bankAccountNumber || 'N/A'}</p>
                          <p><span className='font-medium'>{t('Account Name')}:</span> {bankInfo.bankAccountName || 'N/A'}</p>
                        </div>
                      ) : null
                    })()}
                    {paymentMethod === 'Cash On Delivery' && (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {t('Pay when you receive')}
                      </p>
                    )}
                  </div>
                  <div className='col-span-2'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsPaymentMethodSelected(false)
                        if (paymentMethod) setIsDeliveryDateSelected(true)
                      }}
                    >
                      {t('Change')}
                    </Button>
                  </div>
                </div>
              ) : isAddressSelected ? (
                <>
                  <div className='flex text-primary text-lg font-bold my-2'>
                    <span className='w-8'>2 </span>
                    <span>{t('Choose a payment method')}</span>
                  </div>
                  <Card className='md:ml-8 my-4'>
                    <CardContent className='p-4 space-y-4'>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value)}
                      >
                        {availablePaymentMethods.map((pm) => (
                          <div 
                            key={pm.name} 
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              paymentMethod === pm.name 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-muted-foreground/50'
                            }`}
                            onClick={() => setPaymentMethod(pm.name)}
                          >
                            <div className='flex items-center'>
                              <RadioGroupItem
                                value={pm.name}
                                id={`payment-${pm.name}`}
                              />
                              <Label
                                className='font-bold pl-2 cursor-pointer flex-1'
                                htmlFor={`payment-${pm.name}`}
                              >
                                {pm.name}
                              </Label>
                              {pm.name === 'Cash On Delivery' && (
                                <span className='text-xs text-muted-foreground'>
                                  {t('Pay when you receive')}
                                </span>
                              )}
                              {pm.name === 'Bank Transfer' && (
                                <span className='text-xs text-muted-foreground'>
                                  {t('Transfer to bank account')}
                                </span>
                              )}
                            </div>
                            
                            {/* Payment method details when selected */}
                            {paymentMethod === pm.name && pm.name === 'Bank Transfer' && (
                              <div className='mt-3 ml-6 text-sm space-y-2 bg-muted/50 p-3 rounded-lg'>
                                <p className='font-semibold text-foreground'>{t('Bank Transfer Info')}</p>
                                <div className='space-y-1 text-muted-foreground'>
                                  <p><span className='font-medium'>{t('Bank Name')}:</span> <strong className='text-foreground'>{pm.bankName || 'N/A'}</strong></p>
                                  <p><span className='font-medium'>{t('Account Number')}:</span> <strong className='text-foreground'>{pm.bankAccountNumber || 'N/A'}</strong></p>
                                  <p><span className='font-medium'>{t('Account Name')}:</span> <strong className='text-foreground'>{pm.bankAccountName || 'N/A'}</strong></p>
                                </div>
                                <p className='text-xs text-amber-600'>
                                  {pm.description || t('Bank Transfer Note')}
                                </p>
                              </div>
                            )}
                            
                            {paymentMethod === pm.name && pm.name === 'Cash On Delivery' && (
                              <div className='mt-3 ml-6 text-sm bg-muted/50 p-3 rounded-lg'>
                                <p className='text-muted-foreground'>
                                  {pm.description || t('COD Note')}
                                </p>
                              </div>
                            )}
                            
                            {paymentMethod === pm.name && pm.name === 'Stripe' && (
                              <div className='mt-3 ml-6 text-sm bg-muted/50 p-3 rounded-lg'>
                                <p className='text-muted-foreground'>
                                  {pm.description || t('Stripe Note')}
                                </p>
                              </div>
                            )}
                            
                            {paymentMethod === pm.name && pm.name === 'PayPal' && (
                              <div className='mt-3 ml-6 text-sm bg-muted/50 p-3 rounded-lg'>
                                <p className='text-muted-foreground'>
                                  {pm.description || t('PayPal Note')}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                    <CardFooter className='p-4'>
                      <Button
                        onClick={handleSelectPaymentMethod}
                        className='rounded-full font-bold'
                      >
                        {t('Use this payment method')}
                      </Button>
                    </CardFooter>
                  </Card>
                </>
              ) : (
                <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                  <span className='w-8'>2 </span>
                  <span>{t('Choose a payment method')}</span>
                </div>
              )}
            </div>

            {/* items and delivery date */}
            <div>
              {isDeliveryDateSelected && deliveryDateIndex != undefined ? (
                <div className='grid grid-cols-1 md:grid-cols-12 my-3 pb-3'>
                  <div className='flex text-lg font-bold col-span-5'>
                    <span className='w-8'>3 </span>
                    <span>{t('Items and shipping')}</span>
                  </div>
                  <div className='col-span-5'>
                    <p>
                      {t('Delivery date')}:{' '}
                      {
                        formatDateTime(
                          calculateFutureDate(
                            availableDeliveryDates[deliveryDateIndex].daysToDeliver
                          )
                        ).dateOnly
                      }
                    </p>
                    <ul>
                      {items.map((item, _index) => (
                        <li key={_index}>
                          {item.name} x {item.quantity} ={' '}
                          <ProductPrice price={item.price} plain />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='col-span-2'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsPaymentMethodSelected(true)
                        setIsDeliveryDateSelected(false)
                      }}
                    >
                      {t('Change')}
                    </Button>
                  </div>
                </div>
              ) : isPaymentMethodSelected && isAddressSelected ? (
                <>
                  <div className='flex text-primary text-lg font-bold my-2'>
                    <span className='w-8'>3 </span>
                    <span>{t('Review items and shipping')}</span>
                  </div>
                  <Card className='md:ml-8'>
                    <CardContent className='p-4'>
                      <p className='mb-2'>
                        <span className='text-lg font-bold text-green-700'>
                          {t('Arriving')}{' '}
                          {
                            formatDateTime(
                              calculateFutureDate(
                                availableDeliveryDates[deliveryDateIndex!]
                                  .daysToDeliver
                              )
                            ).dateOnly
                          }
                        </span>
                      </p>
                      <div className='grid md:grid-cols-2 gap-6'>
                        <div>
                          {items.map((item, _index) => (
                            <div key={_index} className='flex gap-4 py-2'>
                              <div className='relative w-16 h-16'>
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes='20vw'
                                  style={{ objectFit: 'contain' }}
                                />
                              </div>
                              <div className='flex-1'>
                                <p className='font-semibold'>
                                  {item.name}
                                  {item.color && `, ${item.color}`}
                                  {item.size && `, ${item.size}`}
                                </p>
                                <p className='font-bold'>
                                  <ProductPrice price={item.price} plain />
                                </p>
                                <Select
                                  value={item.quantity.toString()}
                                  onValueChange={(value) => {
                                    if (value === '0') removeItem(item)
                                    else updateItem(item, Number(value))
                                  }}
                                >
                                  <SelectTrigger className='w-24'>
                                    <SelectValue>
                                      {t('Qty')}: {item.quantity}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent position='popper'>
                                    {Array.from({
                                      length: item.countInStock,
                                    }).map((_, i) => (
                                      <SelectItem key={i + 1} value={`${i + 1}`}>
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                    <SelectItem key='delete' value='0'>
                                      {t('Delete')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className='font-bold'>
                            <p className='mb-2'>{t('Choose a shipping speed')}:</p>
                            <ul>
                              <RadioGroup
                                value={
                                  availableDeliveryDates[deliveryDateIndex!].name
                                }
                                onValueChange={(value) =>
                                  setDeliveryDateIndex(
                                    availableDeliveryDates.findIndex(
                                      (address) => address.name === value
                                    )!
                                  )
                                }
                              >
                                {availableDeliveryDates.map((dd) => (
                                  <div key={dd.name} className='flex'>
                                    <RadioGroupItem
                                      value={dd.name}
                                      id={`address-${dd.name}`}
                                    />
                                    <Label
                                      className='pl-2 space-y-2 cursor-pointer'
                                      htmlFor={`address-${dd.name}`}
                                    >
                                      <div className='text-green-700 font-semibold'>
                                        {
                                          formatDateTime(
                                            calculateFutureDate(dd.daysToDeliver)
                                          ).dateOnly
                                        }
                                      </div>
                                      <div>
                                        {(dd.freeShippingMinPrice > 0 &&
                                        itemsPrice >= dd.freeShippingMinPrice
                                          ? 0
                                          : dd.shippingPrice) === 0 ? (
                                          t('FREE Shipping')
                                        ) : (
                                          <ProductPrice
                                            price={dd.shippingPrice}
                                            plain
                                          />
                                        )}
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                  <span className='w-8'>3 </span>
                  <span>{t('Items and shipping')}</span>
                </div>
              )}
            </div>

            {isPaymentMethodSelected && isAddressSelected && (
              <div className='mt-6'>
                <div className='block md:hidden'>
                  <CheckoutSummary />
                </div>

                <Card className='hidden md:block'>
                  <CardContent className='p-4 flex flex-col md:flex-row justify-between items-center gap-3'>
                    <OrderButton />
                    <div className='flex-1'>
                      <p className='font-bold text-lg'>
                        {t('Order Total')}:{' '}
                        <ProductPrice price={totalPrice} plain />
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {site.name}{' '}
                        <Link href='/page/privacy-policy'>{t('privacy notice')}</Link>{' '}
                        <Link href='/page/conditions-of-use'>
                          {t('conditions of use')}
                        </Link>
                        .
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <CheckoutFooter />
          </div>
          <div className='hidden md:block'>
            <CheckoutSummary />
          </div>
        </div>
      </main>
    </>
  )
}

export default CheckoutForm
