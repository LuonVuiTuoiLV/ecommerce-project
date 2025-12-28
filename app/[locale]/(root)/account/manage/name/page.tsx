import { SessionProvider } from 'next-auth/react'
import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'

import { Card, CardContent } from '@/components/ui/card'
import { getSetting } from '@/lib/actions/setting.actions'
import Link from 'next/link'
import { ProfileForm } from './profile-form'

export async function generateMetadata() {
  const t = await getTranslations('Account')
  return {
    title: t('Change Your Name'),
  }
}

export default async function ProfilePage() {
  const session = await auth()
  const { site } = await getSetting()
  const t = await getTranslations('Account')
  return (
    <div className='mb-24'>
      <SessionProvider session={session}>
        <div className='flex gap-2 '>
          <Link href='/account'>{t('Your Account')}</Link>
          <span>›</span>
          <Link href='/account/manage'>{t('Login & security')}</Link>
          <span>›</span>
          <span>{t('Change Your Name')}</span>
        </div>
        <h1 className='h1-bold py-4'>{t('Change Your Name')}</h1>
        <Card className='max-w-2xl'>
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <p className='text-sm py-2'>
              {t('Change name description', { name: site.name })}
            </p>
            <ProfileForm />
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  )
}
