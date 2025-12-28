import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getContactById, updateContactStatus } from '@/lib/actions/contact.actions'
import { formatDateTime } from '@/lib/utils'
import { ChevronLeft, Mail, Phone, User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ContactStatusUpdate from './contact-status-update'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Contact Details'),
  }
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('Admin')
  const { id } = await params

  const contact = await getContactById(id)

  if (!contact) {
    notFound()
  }

  // Mark as read if new
  if (contact.status === 'new') {
    await updateContactStatus(id, 'read')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      new: 'destructive',
      read: 'secondary',
      replied: 'default',
      closed: 'outline',
    }
    return <Badge variant={variants[status]}>{t(status.charAt(0).toUpperCase() + status.slice(1))}</Badge>
  }

  return (
    <div className="space-y-4 max-w-3xl px-4 sm:px-0">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/contacts"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('Back')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{t('Contact Details')}</h1>
        {getStatusBadge(contact.status)}
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl break-words">{contact.subject}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatDateTime(contact.createdAt).dateTime}
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          {/* Sender Info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{contact.name}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-primary hover:underline truncate"
              >
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-primary hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold mb-2">{t('Message')}</h3>
            <div className="p-3 sm:p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm sm:text-base break-words">
              {contact.message}
            </div>
          </div>

          {/* Status Update */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">{t('Update Status')}</h3>
            <ContactStatusUpdate contactId={id} currentStatus={contact.status} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
