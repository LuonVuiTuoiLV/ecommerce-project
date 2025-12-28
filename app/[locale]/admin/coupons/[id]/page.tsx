import { getCouponById } from '@/lib/actions/coupon.actions'
import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CouponForm from '../coupon-form'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Edit Coupon'),
  }
}

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('Admin')
  const { id } = await params

  const coupon = await getCouponById(id)

  if (!coupon) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/coupons"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('Back')}
        </Link>
      </div>
      <h1 className="h1-bold">{t('Edit Coupon')}: {coupon.code}</h1>
      <CouponForm type="Update" coupon={coupon} couponId={id} />
    </div>
  )
}
