import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { getUserById } from '@/lib/actions/user.actions'

import Link from 'next/link'
import UserEditForm from './user-edit-form'

export async function generateMetadata() {
  const t = await getTranslations('AdminForm')
  return {
    title: t('Update User'),
  }
}

export default async function UserEditPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const t = await getTranslations('Admin')

  const { id } = params

  const user = await getUserById(id)
  if (!user) notFound()
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/users'>{t('Users')}</Link>
        <span className='mx-1'>›</span>
        <Link href={`/admin/users/${user._id}`}>{user._id}</Link>
      </div>

      <div className='my-8'>
        <UserEditForm user={user} />
      </div>
    </main>
  )
}
