import { Button } from '@/components/ui/button'
import { getAllCoupons } from '@/lib/actions/coupon.actions'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import CouponList from './coupon-list'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Coupons'),
  }
}

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string }>
}) {
  const t = await getTranslations('Admin')
  const params = await searchParams
  const page = Number(params.page) || 1
  const query = params.query || ''

  const { data: coupons, totalPages, totalCoupons } = await getAllCoupons({
    query,
    page,
    limit: 10,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1-bold">{t('Coupons')}</h1>
        <Link href="/admin/coupons/create">
          <Button>{t('Create Coupon')}</Button>
        </Link>
      </div>

      <CouponList
        coupons={coupons}
        page={page}
        totalPages={totalPages}
        totalCoupons={totalCoupons}
      />
    </div>
  )
}
