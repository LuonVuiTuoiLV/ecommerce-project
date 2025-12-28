import { Card, CardContent } from '@/components/ui/card'
import { getSetting } from '@/lib/actions/setting.actions'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import ContactForm from './contact-form'

export async function generateMetadata() {
  const t = await getTranslations('Contact')
  return {
    title: t('Contact Us'),
  }
}

export default async function ContactPage() {
  const t = await getTranslations('Contact')
  const { site } = await getSetting()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('Contact Us')}</h1>
      <p className="text-center text-muted-foreground mb-8">
        {t('We would love to hear from you')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold">{t('Address')}</h3>
                <p className="text-sm text-muted-foreground break-words">{site.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold">{t('Phone')}</h3>
                <p className="text-sm text-muted-foreground break-words">{site.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold">{t('Email')}</h3>
                <p className="text-sm text-muted-foreground break-all">{site.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">{t('Business Hours')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('Mon - Sat')}: 9:00 AM - 6:00 PM
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('Sunday')}: {t('Closed')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">{t('Send us a message')}</h2>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
