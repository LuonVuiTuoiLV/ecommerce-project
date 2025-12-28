import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ReviewList from './review-list'

export const metadata: Metadata = {
  title: 'Reviews',
}

export default async function ReviewsPage() {
  const t = await getTranslations('Admin')
  
  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>{t('Reviews')}</h1>
      <ReviewList />
    </div>
  )
}
