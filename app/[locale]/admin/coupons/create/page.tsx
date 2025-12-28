import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import CouponForm from '../coupon-form'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Create Coupon'),
  }
}

export default async function CreateCouponPage() {
  const t = await getTranslations('Admin')

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
      <h1 className="h1-bold">{t('Create Coupon')}</h1>
      <CouponForm type="Create" />
    </div>
  )
}
