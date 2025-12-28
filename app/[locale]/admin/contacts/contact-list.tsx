'use client'

import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
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
import { deleteContact } from '@/lib/actions/contact.actions'
import { IContact } from '@/lib/db/models/contact.model'
import { formatDateTime } from '@/lib/utils'
import { Mail, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface ContactListProps {
  contacts: IContact[]
  page: number
  totalPages: number
  totalContacts: number
  currentStatus: string
}

export default function ContactList({
  contacts,
  page,
  totalPages,
  totalContacts,
  currentStatus,
}: ContactListProps) {
  const t = useTranslations('Admin')
  const router = useRouter()
  const searchParams = useSearchParams()

  const getStatusBadge = (status: IContact['status']) => {
    const variants: Record<IContact['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
      new: 'destructive',
      read: 'secondary',
      replied: 'default',
      closed: 'outline',
    }
    const labels: Record<IContact['status'], string> = {
      new: t('New'),
      read: t('Read'),
      replied: t('Replied'),
      closed: t('Closed'),
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    params.set('page', '1')
    router.push(`/admin/contacts?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {totalContacts} {t('results')}
        </div>
        <Select value={currentStatus} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder={t('Filter by status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All')}</SelectItem>
            <SelectItem value="new">{t('New')}</SelectItem>
            <SelectItem value="read">{t('Read')}</SelectItem>
            <SelectItem value="replied">{t('Replied')}</SelectItem>
            <SelectItem value="closed">{t('Closed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('No contacts found')}
          </div>
        ) : (
          contacts.map((contact) => (
            <Card key={contact._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium truncate">{contact.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.email}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(contact.status)}
                </div>
                <p className="font-medium line-clamp-2 mb-2">{contact.subject}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {formatDateTime(contact.createdAt).dateTime}
                </p>
                <div className="flex gap-2">
                  <Link href={`/admin/contacts/${contact._id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      {t('View')}
                    </Button>
                  </Link>
                  <DeleteDialog id={contact._id} action={deleteContact} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('From')}</TableHead>
              <TableHead>{t('Subject')}</TableHead>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('No contacts found')}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1">{contact.subject}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(contact.createdAt).dateTime}
                  </TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/contacts/${contact._id}`}>
                        <Button size="sm" variant="outline">
                          {t('View')}
                        </Button>
                      </Link>
                      <DeleteDialog id={contact._id} action={deleteContact} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
