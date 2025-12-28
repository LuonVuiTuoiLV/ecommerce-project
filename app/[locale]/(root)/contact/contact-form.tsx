'use client'
// Contact form component

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { submitContactForm } from '@/lib/actions/contact.actions'
import { ContactInputSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type ContactFormValues = z.infer<typeof ContactInputSchema>

export default function ContactForm() {
  const t = useTranslations('Contact')
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(ContactInputSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      const result = await submitContactForm(values)

      if (result.success) {
        toast({
          description: t('Message sent successfully'),
        })
        form.reset()
      } else {
        toast({
          variant: 'destructive',
          description: t('Failed to send message'),
        })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Name')}*</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter your name')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Email')}*</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('Enter your email')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Phone')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter your phone')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Subject')}*</FormLabel>
                <FormControl>
                  <Input placeholder={t('Enter subject')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Message')}*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('Enter your message')}
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Sending')}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t('Send Message')}
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
