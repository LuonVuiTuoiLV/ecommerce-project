'use client'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel'
import { IProduct } from '@/lib/db/models/product.model'
import * as React from 'react'
import ProductCard from './product-card'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string
  products: IProduct[]
  hideDetails?: boolean
}) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return

    const updateScrollState = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    updateScrollState()
    api.on('select', updateScrollState)
    api.on('reInit', updateScrollState)

    return () => {
      api.off('select', updateScrollState)
      api.off('reInit', updateScrollState)
    }
  }, [api])

  // Calculate items per view based on hideDetails
  const itemsPerView = hideDetails ? 6 : 5 // lg breakpoint
  const showArrows = products.length > itemsPerView

  return (
    <div className='w-full bg-background'>
      {title && <h2 className='h2-bold mb-5'>{title}</h2>}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
        }}
        className='w-full'
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.slug}
              className={
                hideDetails
                  ? 'basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6'
                  : 'basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/5'
              }
            >
              <ProductCard
                hideDetails={hideDetails}
                hideAddToCart
                hideBorder
                product={product}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {showArrows && canScrollPrev && (
          <CarouselPrevious className='left-0 hidden md:flex' />
        )}
        {showArrows && canScrollNext && (
          <CarouselNext className='right-0 hidden md:flex' />
        )}
      </Carousel>
    </div>
  )
}
