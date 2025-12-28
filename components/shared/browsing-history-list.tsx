'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import ProductSlider from './product/product-slider'

export default function BrowsingHistoryList({
  className,
}: {
  className?: string
}) {
  const { products, clear } = useBrowsingHistory()
  const t = useTranslations()

  if (products.length === 0) return null

  return (
    <div className='bg-background'>
      <Separator className={cn('mb-4', className)} />
      <ProductList
        title={t("Home.Related to items that you've viewed")}
        type='related'
      />
      <Separator className='mb-4' />
      <div className='flex items-center justify-between mb-2'>
        <h2 className='h2-bold'>{t('Home.Your browsing history')}</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={clear}
          className='text-muted-foreground hover:text-destructive'
        >
          <Trash2 className='h-4 w-4 mr-1' />
          {t('Header.Clear')}
        </Button>
      </div>
      <ProductList
        title=''
        hideDetails
        type='history'
        hideTitle
      />
    </div>
  )
}

function ProductList({
  title,
  type = 'history',
  hideDetails = false,
  excludeId = '',
  hideTitle = false,
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  hideDetails?: boolean
  hideTitle?: boolean
}) {
  const { products } = useBrowsingHistory()
  const [data, setData] = React.useState([])
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(
        `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${products
          .map((product) => product.category)
          .join(',')}&ids=${products.map((product) => product.id).join(',')}`
      )
      const data = await res.json()
      setData(data)
    }
    fetchProducts()
  }, [excludeId, products, type])

  return (
    data.length > 0 && (
      <ProductSlider title={hideTitle ? '' : title} products={data} hideDetails={hideDetails} />
    )
  )
}
