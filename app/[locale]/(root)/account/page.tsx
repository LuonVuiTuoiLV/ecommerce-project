import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Home, PackageCheckIcon, User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function generateMetadata() {
  const t = await getTranslations('Account')
  return {
    title: t('Your Account'),
  }
}
export default async function AccountPage() {
  const t = await getTranslations('Account')
  const tWishlist = await getTranslations('Wishlist')
  return (
    <div>
      <h1 className='h1-bold py-4'>{t('Your Account')}</h1>
      <div className='grid md:grid-cols-3 gap-4 items-stretch'>
        <Card>
          <Link href='/account/orders'>
            <CardContent className='flex items-start gap-4 p-6'>
              <div>
                <PackageCheckIcon className='w-12 h-12' />
              </div>
              <div>
                <h2 className='text-xl font-bold'>{t('Orders')}</h2>
                <p className='text-muted-foreground'>
                  {t('Track return cancel')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link href='/wishlist'>
            <CardContent className='flex items-start gap-4 p-6'>
              <div>
                <Heart className='w-12 h-12' />
              </div>
              <div>
                <h2 className='text-xl font-bold'>{tWishlist('My Wishlist')}</h2>
                <p className='text-muted-foreground'>
                  {tWishlist('Start adding products')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link href='/account/manage'>
            <CardContent className='flex items-start gap-4 p-6'>
              <div>
                <User className='w-12 h-12' />
              </div>
              <div>
                <h2 className='text-xl font-bold'>{t('Login & security')}</h2>
                <p className='text-muted-foreground'>
                  {t('Manage password email')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link href='/account/addresses'>
            <CardContent className='flex items-start gap-4 p-6'>
              <div>
                <Home className='w-12 h-12' />
              </div>
              <div>
                <h2 className='text-xl font-bold'>{t('Addresses')}</h2>
                <p className='text-muted-foreground'>
                  {t('Edit remove address')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
      <BrowsingHistoryList className='mt-16' />
    </div>
  )
}
