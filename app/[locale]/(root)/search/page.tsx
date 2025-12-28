import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import Rating from '@/components/shared/product/rating'
import PriceFilter from '@/components/shared/search/price-filter'
import { Button } from '@/components/ui/button'
import {
    getAllCategories,
    getAllProducts,
    getAllTags,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { getFilterUrl } from '@/lib/utils'

import CollapsibleOnMobile from '@/components/shared/collapsible-on-mobile'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
}) {
  const searchParams = await props.searchParams
  const t = await getTranslations()
  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
  } = searchParams

  if (
    (q !== 'all' && q !== '') ||
    category !== 'all' ||
    tag !== 'all' ||
    rating !== 'all' ||
    price !== 'all'
  ) {
    return {
      title: `${t('Search.Search')} ${q !== 'all' ? q : ''}
          ${category !== 'all' ? ` : ${t('Search.Category')} ${category}` : ''}
          ${tag !== 'all' ? ` : ${t('Search.Tag')} ${tag}` : ''}
          ${price !== 'all' ? ` : ${t('Search.Price')} ${price}` : ''}
          ${rating !== 'all' ? ` : ${t('Search.Rating')} ${rating}` : ''}`,
    }
  } else {
    return {
      title: t('Search.Search Products'),
    }
  }
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
}) {
  const searchParams = await props.searchParams

  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
    sort = 'best-selling',
    page = '1',
  } = searchParams

  const params = { q, category, tag, price, rating, sort, page }

  const categories = await getAllCategories()
  const tags = await getAllTags()
  const data = await getAllProducts({
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
  })
  const t = await getTranslations()

  const sortOrders = [
    { value: 'price-low-to-high', name: t('Search.Price Low to High') },
    { value: 'price-high-to-low', name: t('Search.Price High to Low') },
    { value: 'newest-arrivals', name: t('Search.Newest Arrivals') },
    { value: 'avg-customer-review', name: t('Search.Avg Customer Review') },
    { value: 'best-selling', name: t('Search.Best Selling') },
  ]

  return (
    <div className='px-2 md:px-4'>
      {/* Search Results Header */}
      <div className='my-2 bg-card md:border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-2'>
        <div className='flex flex-wrap items-center gap-2 text-sm md:text-base'>
          {/* Results count */}
          <span className='font-medium'>
            {data.totalProducts === 0
              ? t('Search.No')
              : `${data.from}-${data.to} ${t('Search.of')} ${data.totalProducts}`}{' '}
            {t('Search.results')}
          </span>
          
          {/* Active filters */}
          {((q !== 'all' && q !== '') ||
            (category !== 'all' && category !== '') ||
            (tag !== 'all' && tag !== '') ||
            rating !== 'all' ||
            price !== 'all') && (
            <>
              <span className='text-muted-foreground'>-</span>
              <div className='flex flex-wrap items-center gap-2'>
                {q !== 'all' && q !== '' && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm'>
                    &ldquo;{q}&rdquo;
                  </span>
                )}
                {category !== 'all' && category !== '' && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm'>
                    <span className='text-muted-foreground'>{t('Search.Category')}:</span>
                    <span className='font-medium'>{category}</span>
                  </span>
                )}
                {tag !== 'all' && tag !== '' && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm'>
                    <span className='text-muted-foreground'>{t('Search.Tag')}:</span>
                    <span className='font-medium'>{tag}</span>
                  </span>
                )}
                {rating !== 'all' && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm'>
                    <span className='text-muted-foreground'>{t('Search.Rating')}:</span>
                    <span className='font-medium'>{rating}+ {t('Search.& Up')}</span>
                  </span>
                )}
                <Button variant={'ghost'} size='sm' asChild className='h-7 px-2'>
                  <Link href='/search'>{t('Search.Clear')}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
        <div className='flex-shrink-0'>
          <ProductSortSelector
            sortOrders={sortOrders}
            sort={sort}
            params={params}
          />
        </div>
      </div>
      <div className='bg-card grid md:grid-cols-5 md:gap-4'>
        <CollapsibleOnMobile title={t('Search.Filters')}>
          <div className='space-y-6 p-4 md:p-4 md:pr-4 md:border-r'>
            {/* Department Filter */}
            <div>
              <div className='font-bold text-base mb-3 pb-2 border-b'>{t('Search.Department')}</div>
              <ul className='space-y-2'>
                <li>
                  <Link
                    className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                      ('all' === category || '' === category) ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                    href={getFilterUrl({ category: 'all', params })}
                  >
                    {t('Search.All')}
                  </Link>
                </li>
                {categories.map((c: string) => (
                  <li key={c}>
                    <Link
                      className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                        c === category ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                      href={getFilterUrl({ category: c, params })}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter - Client Component */}
            <PriceFilter price={price} params={params} />

            {/* Customer Review Filter */}
            <div>
              <div className='font-bold text-base mb-3 pb-2 border-b'>{t('Search.Customer Review')}</div>
              <ul className='space-y-2'>
                <li>
                  <Link
                    href={getFilterUrl({ rating: 'all', params })}
                    className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                      'all' === rating ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    {t('Search.All')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getFilterUrl({ rating: '4', params })}
                    className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                      '4' === rating ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    <div className='flex items-center gap-1'>
                      <Rating size={4} rating={4} /> {t('Search.& Up')}
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tag Filter */}
            <div>
              <div className='font-bold text-base mb-3 pb-2 border-b'>{t('Search.Tag')}</div>
              <ul className='space-y-2'>
                <li>
                  <Link
                    className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                      ('all' === tag || '' === tag) ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                    href={getFilterUrl({ tag: 'all', params })}
                  >
                    {t('Search.All')}
                  </Link>
                </li>
                {tags.map((tagItem: string) => (
                  <li key={tagItem}>
                    <Link
                      className={`block py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                        tagItem === tag ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                      href={getFilterUrl({ tag: tagItem, params })}
                    >
                      {tagItem}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleOnMobile>

        <div className='md:col-span-4 space-y-4 mt-4 md:mt-0'>
          <div className='px-2 md:px-0'>
            <div className='font-bold text-lg md:text-xl'>{t('Search.Results')}</div>
            <div className='text-sm text-muted-foreground'>
              {t('Search.Check each product page for other buying options')}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.products.length === 0 && (
              <div className='col-span-full text-center py-8 text-muted-foreground'>
                {t('Search.No product found')}
              </div>
            )}
            {data.products.map((product: IProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </div>
      </div>
    </div>
  )
}
