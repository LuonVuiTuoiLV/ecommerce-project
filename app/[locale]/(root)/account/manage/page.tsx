import { SessionProvider } from 'next-auth/react'
import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export async function generateMetadata() {
  const t = await getTranslations('Account')
  return {
    title: t('Login & security'),
  }
}
export default async function ProfilePage() {
  const session = await auth()
  const t = await getTranslations('Account')
  return (
    <div className='mb-24'>
      <SessionProvider session={session}>
        <div className='flex gap-2 '>
          <Link href='/account'>{t('Your Account')}</Link>
          <span>›</span>
          <span>{t('Login & security')}</span>
        </div>
        <h1 className='h1-bold py-4'>{t('Login & security')}</h1>
        <Card className='max-w-2xl '>
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Name')}</h3>
              <p>{session?.user.name}</p>
            </div>
            <div>
              <Link href='/account/manage/name'>
                <Button className='rounded-full w-32' variant='outline'>
                  {t('Edit')}
                </Button>
              </Link>
            </div>
          </CardContent>
          <Separator />
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Email')}</h3>
              <p>{session?.user.email}</p>
              <p>{t('will be implemented')}</p>
            </div>
            <div>
              <Link href='#'>
                <Button
                  disabled
                  className='rounded-full w-32'
                  variant='outline'
                >
                  {t('Edit')}
                </Button>
              </Link>
            </div>
          </CardContent>
          <Separator />
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Password')}</h3>
              <p>************</p>
              <p>{t('will be implemented')}</p>
            </div>
            <div>
              <Link href='#'>
                <Button
                  disabled
                  className='rounded-full w-32'
                  variant='outline'
                >
                  {t('Edit')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  )
}
