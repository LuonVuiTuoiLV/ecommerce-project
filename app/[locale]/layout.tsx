import ClientProviders from '@/components/shared/client-providers'
import { getDirection } from '@/i18n-config'
import { routing } from '@/i18n/routing'
import { getSetting } from '@/lib/actions/setting.actions'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Map locale to default currency
const localeCurrencyMap: Record<string, string> = {
  'vi': 'VND',
  'en-US': 'USD',
}

export async function generateMetadata() {
  const {
    site: { slogan, name, description, url },
  } = await getSetting()
  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${slogan}`,
    },
    description: description,
    metadataBase: new URL(url),
  }
}

export default async function AppLayout({
  params,
  children,
}: {
  params: { locale: string }
  children: React.ReactNode
}) {
  const setting = await getSetting()
  const { locale } = await params
  
  // Get currency from cookie or default based on locale
  const currencyCookie = (await cookies()).get('currency')
  const defaultCurrencyForLocale = localeCurrencyMap[locale] || 'VND'
  const currency = currencyCookie ? currencyCookie.value : defaultCurrencyForLocale

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === 'rtl' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders setting={{ ...setting, currency }}>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
