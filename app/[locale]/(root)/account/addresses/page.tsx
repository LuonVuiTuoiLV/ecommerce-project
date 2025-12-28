import { getTranslations } from 'next-intl/server'
import AddressList from './address-list'

export async function generateMetadata() {
  const t = await getTranslations('Account')
  return {
    title: t('Addresses'),
  }
}

export default async function AddressesPage() {
  const t = await getTranslations('Account')
  
  return (
    <div className='max-w-4xl mx-auto'>
      <h1 className='h1-bold py-4'>{t('Addresses')}</h1>
      <AddressList />
    </div>
  )
}
