import { getTranslations } from 'next-intl/server'
import ProductList from './product-list'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Products'),
  }
}

export default async function AdminProduct() {
  return <ProductList />
}
