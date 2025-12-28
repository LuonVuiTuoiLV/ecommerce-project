'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
    createCoupon,
    updateCoupon,
} from '@/lib/actions/coupon.actions'
import { ICoupon } from '@/lib/db/models/coupon.model'
import { CouponInputSchema, CouponUpdateSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Generate random coupon code (client-side utility)
function generateCouponCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

type CouponFormValues = z.infer<typeof CouponInputSchema>

const defaultValues: CouponFormValues = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderValue: 0,
  maxDiscount: undefined,
  usageLimit: 100,
  usedCount: 0,
  usagePerUser: 1,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isActive: true,
  applicableCategories: [],
}

interface CouponFormProps {
  type: 'Create' | 'Update'
  coupon?: ICoupon
  couponId?: string
}

export default function CouponForm({ type, coupon, couponId }: CouponFormProps) {
  const t = useTranslations('AdminForm')
  const tAdmin = useTranslations('Admin')
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(
      type === 'Update' ? CouponUpdateSchema : CouponInputSchema
    ),
    defaultValues: coupon
      ? {
          ...coupon,
          startDate: new Date(coupon.startDate),
          endDate: new Date(coupon.endDate),
        }
      : defaultValues,
  })

  const discountType = form.watch('discountType')

  const onSubmit = async (values: CouponFormValues) => {
    if (type === 'Create') {
      const res = await createCoupon(values)
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message })
      } else {
        toast({ description: res.message })
        router.push('/admin/coupons')
      }
    } else {
      if (!couponId) {
        router.push('/admin/coupons')
        return
      }
      const res = await updateCoupon({ ...values, _id: couponId })
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message })
      } else {
        toast({ description: res.message })
        router.push('/admin/coupons')
      }
    }
  }

  const handleGenerateCode = () => {
    form.setValue('code', generateCouponCode())
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Coupon Code')}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="SAVE20" {...field} className="uppercase flex-1" />
                        <Button type="button" variant="outline" onClick={handleGenerateCode} className="shrink-0">
                          {t('Generate')}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('Enter coupon description')} {...field} rows={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Discount Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">{t('Percentage')} (%)</SelectItem>
                        <SelectItem value="fixed">{t('Fixed Amount')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Discount Value')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={discountType === 'percentage' ? '20' : '10000'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {discountType === 'percentage' ? '%' : t('Currency amount')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {discountType === 'percentage' && (
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Max Discount')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>{t('Optional cap')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Minimum Order Value')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Usage Limit')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormDescription>{t('Total uses allowed')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usagePerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Usage Per User')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormDescription>{t('Max uses per user')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Start Date')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('End Date')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{t('Is Active')}</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/coupons')} className="w-full sm:w-auto">
            {tAdmin('Cancel')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
            {form.formState.isSubmitting
              ? t('Submitting')
              : type === 'Create'
              ? t('Create Coupon')
              : t('Update Coupon')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
