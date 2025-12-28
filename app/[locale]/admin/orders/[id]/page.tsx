import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { auth } from '@/auth'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import { getOrderById } from '@/lib/actions/order.actions'
import Link from 'next/link'

export async function generateMetadata() {
  const t = await getTranslations('Order')
  return {
    title: t('Order Details'),
  }
}

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params
  const t = await getTranslations('Admin')

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()

  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/orders'>{t('Orders')}</Link> <span className='mx-1'>›</span>
        <Link href={`/admin/orders/${order._id}`}>{order._id}</Link>
      </div>
      <OrderDetailsForm
        order={order}
        isAdmin={session?.user?.role === 'Admin' || false}
      />
    </main>
  )
}

export default AdminOrderDetailsPage
