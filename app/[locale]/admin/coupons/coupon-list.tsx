'use client'

import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import ProductPrice from '@/components/shared/product/product-price'
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
import { deleteCoupon } from '@/lib/actions/coupon.actions'
import { ICoupon } from '@/lib/db/models/coupon.model'
import { formatDateTime } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface CouponListProps {
  coupons: ICoupon[]
  page: number
  totalPages: number
  totalCoupons: number
}

export default function CouponList({
  coupons,
  page,
  totalPages,
  totalCoupons,
}: CouponListProps) {
  const t = useTranslations('Admin')

  const getCouponStatus = (coupon: ICoupon) => {
    const now = new Date()
    const startDate = new Date(coupon.startDate)
    const endDate = new Date(coupon.endDate)

    if (!coupon.isActive) {
      return { label: t('Inactive'), variant: 'secondary' as const }
    }
    if (now < startDate) {
      return { label: t('Scheduled'), variant: 'outline' as const }
    }
    if (now > endDate) {
      return { label: t('Expired'), variant: 'destructive' as const }
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return { label: t('Exhausted'), variant: 'destructive' as const }
    }
    return { label: t('Active'), variant: 'default' as const }
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">
        {totalCoupons} {t('results')}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('No coupons found')}
          </div>
        ) : (
          coupons.map((coupon) => {
            const status = getCouponStatus(coupon)
            return (
              <Card key={coupon._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-lg">{coupon.code}</p>
                      <Badge variant={status.variant} className="mt-1">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : <ProductPrice price={coupon.discountValue} plain />}
                      </p>
                      {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                        <p className="text-xs text-muted-foreground">
                          (max <ProductPrice price={coupon.maxDiscount} plain />)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">{t('Min Order')}: </span>
                      <ProductPrice price={coupon.minOrderValue} plain />
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('Usage')}: </span>
                      {coupon.usedCount}/{coupon.usageLimit}
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {formatDateTime(coupon.startDate).dateOnly} - {formatDateTime(coupon.endDate).dateOnly}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/coupons/${coupon._id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        {t('Edit')}
                      </Button>
                    </Link>
                    <DeleteDialog id={coupon._id} action={deleteCoupon} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Code')}</TableHead>
              <TableHead>{t('Discount')}</TableHead>
              <TableHead>{t('Min Order')}</TableHead>
              <TableHead>{t('Usage')}</TableHead>
              <TableHead>{t('Valid Period')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('No coupons found')}
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => {
                const status = getCouponStatus(coupon)
                return (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : <ProductPrice price={coupon.discountValue} plain />}
                      {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                        <span className="text-xs text-muted-foreground block">
                          (max <ProductPrice price={coupon.maxDiscount} plain />)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductPrice price={coupon.minOrderValue} plain />
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount}/{coupon.usageLimit}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{formatDateTime(coupon.startDate).dateOnly}</div>
                      <div className="text-muted-foreground">
                        {t('to')} {formatDateTime(coupon.endDate).dateOnly}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/coupons/${coupon._id}`}>
                          <Button size="sm" variant="outline">
                            {t('Edit')}
                          </Button>
                        </Link>
                        <DeleteDialog id={coupon._id} action={deleteCoupon} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
