import { getAllContacts } from '@/lib/actions/contact.actions'
import { getTranslations } from 'next-intl/server'
import ContactList from './contact-list'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Contacts'),
  }
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string; status?: string }>
}) {
  const t = await getTranslations('Admin')
  const params = await searchParams
  const page = Number(params.page) || 1
  const query = params.query || ''
  const status = params.status || 'all'

  const { data: contacts, totalPages, totalContacts, newCount } = await getAllContacts({
    query,
    status,
    page,
    limit: 10,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1-bold">
          {t('Contacts')}
          {newCount > 0 && (
            <span className="ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded-full">
              {newCount} {t('new')}
            </span>
          )}
        </h1>
      </div>

      <ContactList
        contacts={contacts}
        page={page}
        totalPages={totalPages}
        totalContacts={totalContacts}
        currentStatus={status}
      />
    </div>
  )
}
