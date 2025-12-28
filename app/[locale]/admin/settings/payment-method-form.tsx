import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    FormControl,
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
import { ISettingInput } from '@/types'
import { ChevronDown, ChevronUp, TrashIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function PaymentMethodForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const t = useTranslations('AdminForm')
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'availablePaymentMethods',
  })
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = form

  const availablePaymentMethods = watch('availablePaymentMethods')
  const defaultPaymentMethod = watch('defaultPaymentMethod')
  
  // Track which payment methods have expanded details
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    const validCodes = availablePaymentMethods.map((lang) => lang.name)
    if (!validCodes.includes(defaultPaymentMethod)) {
      setValue('defaultPaymentMethod', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(availablePaymentMethods)])

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{t('Payment Methods')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          {fields.map((field, index) => {
            const methodName = watch(`availablePaymentMethods.${index}.name`)
            const isBankTransfer = methodName === 'Bank Transfer'
            const isExpanded = expandedIndex === index
            
            return (
              <div key={field.id} className='border rounded-lg p-4 space-y-3'>
                {/* Basic Info Row */}
                <div className='flex gap-2 items-end'>
                  <FormField
                    control={form.control}
                    name={`availablePaymentMethods.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>{t('Name')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('Name')} />
                        </FormControl>
                        <FormMessage>
                          {errors.availablePaymentMethods?.[index]?.name?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`availablePaymentMethods.${index}.commission`}
                    render={({ field }) => (
                      <FormItem className='w-32'>
                        <FormLabel>{t('Commission')} (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type='number' placeholder='0' />
                        </FormControl>
                        <FormMessage>
                          {errors.availablePaymentMethods?.[index]?.commission?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => toggleExpand(index)}
                  >
                    {isExpanded ? (
                      <ChevronUp className='w-4 h-4' />
                    ) : (
                      <ChevronDown className='w-4 h-4' />
                    )}
                  </Button>
                  <Button
                    type='button'
                    disabled={fields.length === 1}
                    variant='outline'
                    size='icon'
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className='w-4 h-4' />
                  </Button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className='pt-3 border-t space-y-3'>
                    <FormField
                      control={form.control}
                      name={`availablePaymentMethods.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Description')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder={t('Payment method description')}
                              rows={2}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Bank Transfer specific fields */}
                    {isBankTransfer && (
                      <div className='bg-muted/50 p-3 rounded-lg space-y-3'>
                        <p className='text-sm font-medium text-muted-foreground'>
                          {t('Bank Transfer Details')}
                        </p>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                          <FormField
                            control={form.control}
                            name={`availablePaymentMethods.${index}.bankName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('Bank Name')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder='Vietcombank' />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`availablePaymentMethods.${index}.bankAccountNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('Account Number')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder='1234567890' />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`availablePaymentMethods.${index}.bankAccountName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('Account Name')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder='CONG TY TNHH ABC' />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <Button
            type='button'
            variant={'outline'}
            onClick={() => append({ name: '', commission: 0 })}
          >
            {t('Add Payment Method')}
          </Button>
        </div>

        <FormField
          control={control}
          name='defaultPaymentMethod'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Default Payment Method')}</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select a payment method')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods
                      .filter((x) => x.name)
                      .map((pm, index) => (
                        <SelectItem key={index} value={pm.name}>
                          {pm.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.defaultPaymentMethod?.message}</FormMessage>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
