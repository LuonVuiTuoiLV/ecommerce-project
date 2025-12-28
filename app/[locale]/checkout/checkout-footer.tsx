'use client'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function CheckoutFooter() {
  const t = useTranslations('Checkout')
  const {
    setting: { site },
  } = useSettingStore()
  return (
    <div className='border-t-2 space-y-2 my-4 py-4'>
      <p>
        {t('Need help')} <Link href='/page/help'>{t('Help Center')}</Link> {t('or')}{' '}
        <Link href='/page/contact-us'>{t('Contact Us')}</Link>
      </p>
      <p>
        {t('Order policy text', { name: site.name })}
      </p>
      <p>
        {t('Return policy text', { name: site.name })}
      </p>
    </div>
  )
}
