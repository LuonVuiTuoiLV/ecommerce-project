'use client'

import Pagination from '@/components/shared/pagination'
import Rating from '@/components/shared/product/rating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { deleteReview, getAllReviews } from '@/lib/actions/review.actions'
import { formatDateTime } from '@/lib/utils'
import { Eye, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

interface Review {
  _id: string
  user: {
    _id: string
    name: string
  }
  product: {
    _id: string
    name: string
    slug: string
  }
  title: string
  comment: string
  rating: number
  isVerifiedPurchase: boolean
  createdAt: string
}

const PAGE_SIZE = 20

export default function ReviewList() {
  const t = useTranslations('Admin')
  const tProduct = useTranslations('Product')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Get params from URL
  const currentPage = Number(searchParams.get('page')) || 1
  const filterRating = searchParams.get('rating') || 'all'

  const fetchReviews = async (page: number, rating: string) => {
    startTransition(async () => {
      const result = await getAllReviews({
        page,
        limit: PAGE_SIZE,
        rating,
      })
      if (result.success) {
        setReviews(result.data)
        setTotalPages(result.totalPages)
        setTotalReviews(result.totalReviews || 0)
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }

  useEffect(() => {
    fetchReviews(currentPage, filterRating)
  }, [currentPage, filterRating])

  const handleRatingFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('rating')
    } else {
      params.set('rating', value)
    }
    params.set('page', '1')
    router.push(`/admin/reviews?${params.toString()}`)
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('Are you sure you want to delete this review?'))) {
      return
    }
    const result = await deleteReview(reviewId)
    if (result.success) {
      toast({
        description: result.message,
      })
      fetchReviews(currentPage, filterRating)
    } else {
      toast({
        variant: 'destructive',
        description: result.message,
      })
    }
  }

  if (isPending && reviews.length === 0) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin mr-2' />
        {t('Loading')}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filters and Results */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='text-sm text-muted-foreground'>
          {totalReviews} {t('results')}
        </div>
        <Select value={filterRating} onValueChange={handleRatingFilter}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder={t('Filter by rating')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('All')}</SelectItem>
            <SelectItem value='5'>5 {tProduct('rating star', { rating: '' })}</SelectItem>
            <SelectItem value='4'>4 {tProduct('rating star', { rating: '' })}</SelectItem>
            <SelectItem value='3'>3 {tProduct('rating star', { rating: '' })}</SelectItem>
            <SelectItem value='2'>2 {tProduct('rating star', { rating: '' })}</SelectItem>
            <SelectItem value='1'>1 {tProduct('rating star', { rating: '' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop View */}
      <div className='hidden md:block'>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Id')}</TableHead>
                <TableHead>{t('Product')}</TableHead>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Rating')}</TableHead>
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Verified')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center py-8'>
                    {t('No reviews yet')}
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review._id} className={isPending ? 'opacity-50' : ''}>
                    <TableCell className='font-mono text-xs'>
                      {review._id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/product/${review.product.slug}`}
                        className='hover:underline text-sm text-primary'
                      >
                        {review.product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{review.user.name}</TableCell>
                    <TableCell>
                      <Rating rating={review.rating} size={4} />
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {review.title}
                    </TableCell>
                    <TableCell>
                      {review.isVerifiedPurchase && (
                        <Badge variant='secondary' className='text-xs'>
                          {tProduct('Verified Purchase')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {formatDateTime(new Date(review.createdAt)).dateOnly}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button variant='ghost' size='sm' asChild>
                          <Link href={`/product/${review.product.slug}#reviews`}>
                            <Eye className='h-4 w-4' />
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() => handleDelete(review._id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View */}
      <div className='md:hidden space-y-4'>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className='p-6 text-center text-muted-foreground'>
              {t('No reviews yet')}
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id} className={isPending ? 'opacity-50' : ''}>
              <CardContent className='p-4 space-y-3'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='font-semibold text-sm'>{review.title}</div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {review.user.name}
                    </div>
                  </div>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {review._id.slice(-6)}
                  </Badge>
                </div>

                <div className='flex items-center gap-2'>
                  <Rating rating={review.rating} size={4} />
                  {review.isVerifiedPurchase && (
                    <Badge variant='secondary' className='text-xs'>
                      {tProduct('Verified Purchase')}
                    </Badge>
                  )}
                </div>

                <div className='text-sm'>
                  <Link
                    href={`/product/${review.product.slug}`}
                    className='hover:underline text-primary'
                  >
                    {review.product.name}
                  </Link>
                </div>

                <div className='text-sm text-muted-foreground line-clamp-2'>
                  {review.comment}
                </div>

                <div className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(review.createdAt)).dateTime}
                </div>

                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' className='flex-1' asChild>
                    <Link href={`/product/${review.product.slug}#reviews`}>
                      <Eye className='h-4 w-4 mr-2' />
                      {t('View')}
                    </Link>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-destructive hover:text-destructive'
                    onClick={() => handleDelete(review._id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4'>
          <Pagination page={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
