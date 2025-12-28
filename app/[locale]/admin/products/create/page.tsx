import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import ProductForm from '../product-form'

export async function generateMetadata() {
  const t = await getTranslations('AdminForm')
  return {
    title: t('Create Product'),
  }
}

const CreateProductPage = async () => {
  const t = await getTranslations('Admin')
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/products'>{t('Products')}</Link>
        <span className='mx-1'>›</span>
        <Link href='/admin/products/create'>{t('Create Product')}</Link>
      </div>

      <div className='my-8'>
        <ProductForm type='Create' />
      </div>
    </main>
  )
}

export default CreateProductPage
