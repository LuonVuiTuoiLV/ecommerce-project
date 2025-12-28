'use client'

import VietnamAddressSelector from '@/components/shared/address/vietnam-address-selector'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createAddress, updateAddress } from '@/lib/actions/address.actions'
import { IAddress } from '@/lib/db/models/address.model'
import { VietnamAddressSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const AddressFormSchema = VietnamAddressSchema.extend({
  isDefault: z.boolean().default(false),
})

type AddressFormValues = z.infer<typeof AddressFormSchema>

interface AddressFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address?: IAddress | null
  onSuccess: () => void
}

export default function AddressForm({
  open,
  onOpenChange,
  address,
  onSuccess,
}: AddressFormProps) {
  const t = useTranslations('Account')
  const tCheckout = useTranslations('Checkout')
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getDefaultValues = (): AddressFormValues => ({
    fullName: address?.fullName || '',
    phone: address?.phone || '',
    provinceCode: address?.provinceCode || undefined,
    provinceName: address?.provinceName || '',
    wardCode: address?.wardCode || undefined,
    wardName: address?.wardName || '',
    street: address?.street || '',
    country: address?.country || 'Việt Nam',
    isDefault: address?.isDefault || false,
  })

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: getDefaultValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, open])

  const onSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true)
    try {
      let result
      if (address?._id) {
        result = await updateAddress(address._id, data)
      } else {
        result = await createAddress(data)
      }

      if (result.success) {
        toast({ description: result.message })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ variant: 'destructive', description: result.message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset(getDefaultValues())
    onOpenChange(false)
  }

  const provinceCode = form.watch('provinceCode')
  const wardCode = form.watch('wardCode')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[600px] p-0'>
        <DialogHeader className='px-6 py-4 border-b'>
          <DialogTitle className='text-lg font-medium'>
            {address ? t('Edit Address') : t('Add New Address')}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            {t('Fill in your address details')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='px-6 py-4 space-y-4'>
              {/* Contact section */}
              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-3'>
                  {t('Contact')}
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='fullName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          {tCheckout('Full Name')} <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={tCheckout('Enter full name')} 
                            className='h-10'
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          {tCheckout('Phone number')} <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={tCheckout('Enter phone number')} 
                            type='tel'
                            className='h-10'
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Address section - 2 cấp: Tỉnh/Thành phố → Phường/Xã */}
              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-3'>
                  {tCheckout('Address')}
                </h3>
                <div className='space-y-4'>
                  <VietnamAddressSelector
                    provinceCode={provinceCode}
                    wardCode={wardCode}
                    onProvinceChange={(code, name) => {
                      form.setValue('provinceCode', code)
                      form.setValue('provinceName', name)
                      form.setValue('wardCode', undefined)
                      form.setValue('wardName', '')
                    }}
                    onWardChange={(code, name) => {
                      form.setValue('wardCode', code)
                      form.setValue('wardName', name)
                    }}
                    disabled={isSubmitting}
                  />

                  {form.formState.errors.provinceName && (
                    <p className='text-sm text-destructive'>
                      {form.formState.errors.provinceName.message}
                    </p>
                  )}
                  {form.formState.errors.wardName && (
                    <p className='text-sm text-destructive'>
                      {form.formState.errors.wardName.message}
                    </p>
                  )}

                  <FormField
                    control={form.control}
                    name='street'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          {t('Street Address')} <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('Enter street address')} 
                            className='h-10'
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name='isDefault'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='h-5 w-5'
                      />
                    </FormControl>
                    <FormLabel className='text-sm font-normal cursor-pointer'>
                      {t('Set as default address')}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end gap-3 px-6 py-4 border-t bg-muted/30'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isSubmitting}
                className='min-w-[100px]'
              >
                {t('Cancel')}
              </Button>
              <Button 
                type='submit' 
                disabled={isSubmitting}
                className='min-w-[100px]'
              >
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {address ? t('Update') : t('Add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
