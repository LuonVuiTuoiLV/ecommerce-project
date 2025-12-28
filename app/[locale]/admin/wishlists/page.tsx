import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import WishlistList from './wishlist-list'

export const metadata: Metadata = {
  title: 'Wishlists',
}

export default async function WishlistsPage() {
  const t = await getTranslations('Admin')
  
  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>{t('Wishlists')}</h1>
      <WishlistList />
    </div>
  )
}
