'use client'

import Pagination from '@/components/shared/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { getAllWishlists } from '@/lib/actions/wishlist.actions'
import { formatDateTime } from '@/lib/utils'
import { Eye, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

interface WishlistItem {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  product: {
    _id: string
    name: string
    slug: string
    price: number
  }
  createdAt: string
}

const PAGE_SIZE = 20

export default function WishlistList() {
  const t = useTranslations('Admin')
  const searchParams = useSearchParams()
  const [wishlists, setWishlists] = useState<WishlistItem[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalWishlists, setTotalWishlists] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Get page from URL params
  const currentPage = Number(searchParams.get('page')) || 1

  const fetchWishlists = async (page: number) => {
    startTransition(async () => {
      const result = await getAllWishlists({
        page,
        limit: PAGE_SIZE,
      })
      if (result.success) {
        setWishlists(result.data)
        setTotalPages(result.totalPages)
        setTotalWishlists(result.totalWishlists)
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }

  useEffect(() => {
    fetchWishlists(currentPage)
  }, [currentPage])

  if (isPending && wishlists.length === 0) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin mr-2' />
        {t('Loading')}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Results count */}
      <div className='text-sm text-muted-foreground'>
        {totalWishlists} {t('results')}
      </div>

      {/* Desktop View */}
      <div className='hidden md:block'>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Id')}</TableHead>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Email')}</TableHead>
                <TableHead>{t('Product')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wishlists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    {t('No wishlists found')}
                  </TableCell>
                </TableRow>
              ) : (
                wishlists.map((item) => (
                  <TableRow key={item._id} className={isPending ? 'opacity-50' : ''}>
                    <TableCell className='font-mono text-xs'>
                      {item._id.slice(-6)}
                    </TableCell>
                    <TableCell>{item.user.name}</TableCell>
                    <TableCell>{item.user.email}</TableCell>
                    <TableCell>
                      <Link
                        href={`/product/${item.product.slug}`}
                        className='hover:underline text-primary'
                      >
                        {item.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {formatDateTime(new Date(item.createdAt)).dateTime}
                    </TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm' asChild>
                        <Link href={`/admin/users/${item.user._id}`}>
                          <Eye className='h-4 w-4' />
                        </Link>
                      </Button>
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
        {wishlists.length === 0 ? (
          <Card>
            <CardContent className='p-6 text-center text-muted-foreground'>
              {t('No wishlists found')}
            </CardContent>
          </Card>
        ) : (
          wishlists.map((item) => (
            <Card key={item._id} className={isPending ? 'opacity-50' : ''}>
              <CardContent className='p-4 space-y-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <div className='font-semibold'>{item.user.name}</div>
                    <div className='text-sm text-muted-foreground'>
                      {item.user.email}
                    </div>
                  </div>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {item._id.slice(-6)}
                  </Badge>
                </div>
                <div className='text-sm'>
                  <span className='font-medium'>{t('Product')}: </span>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className='hover:underline text-primary'
                  >
                    {item.product.name}
                  </Link>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(item.createdAt)).dateTime}
                </div>
                <Button variant='outline' size='sm' className='w-full' asChild>
                  <Link href={`/admin/users/${item.user._id}`}>
                    <Eye className='h-4 w-4 mr-2' />
                    {t('View')} User
                  </Link>
                </Button>
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
