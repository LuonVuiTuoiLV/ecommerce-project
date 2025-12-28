/* eslint-disable @next/next/no-img-element */
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { ISettingInput } from '@/types'
import { TrashIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'

export default function SiteInfoForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const t = useTranslations('AdminForm')
  const { watch, control } = form

  const siteLogo = watch('site.logo')
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{t('Site Info')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={control}
            name='site.name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter site name')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='site.url'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Url')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter url')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex flex-col gap-5 md:flex-row'>
          <div className='w-full text-left'>
            <FormField
              control={control}
              name='site.logo'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>{t('Logo')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Enter image url')} {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {siteLogo && (
              <div className='flex my-2 items-center gap-2'>
                <img src={siteLogo} alt='logo' width={48} height={48} />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => form.setValue('site.logo', '')}
                >
                  <TrashIcon className='w-4 h-4' />
                </Button>
              </div>
            )}
            {!siteLogo && (
              <UploadButton
                className='!items-start py-2'
                endpoint='imageUploader'
                onClientUploadComplete={(res) => {
                  form.setValue('site.logo', res[0].url)
                }}
                onUploadError={(error: Error) => {
                  toast({
                    variant: 'destructive',
                    description: `ERROR! ${error.message}`,
                  })
                }}
              />
            )}
          </div>
          <FormField
            control={control}
            name='site.description'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Description')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('Enter description')}
                    className='h-40'
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
            control={control}
            name='site.slogan'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Slogan')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter slogan')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='site.keywords'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Keywords')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter keywords')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={control}
            name='site.phone'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Phone')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter phone number')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='site.email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Email')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter email address')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={control}
            name='site.address'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Address')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter address')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='site.copyright'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>{t('Copyright')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter copyright')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
