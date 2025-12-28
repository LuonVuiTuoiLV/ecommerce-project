'use client'

import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { updateContactStatus } from '@/lib/actions/contact.actions'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const statuses = ['new', 'read', 'replied', 'closed'] as const

export default function ContactStatusUpdate({
  contactId,
  currentStatus,
}: {
  contactId: string
  currentStatus: string
}) {
  const t = useTranslations('Admin')
  const { toast } = useToast()
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  const handleUpdateStatus = () => {
    if (status === currentStatus) return

    startTransition(async () => {
      const result = await updateContactStatus(
        contactId,
        status as 'new' | 'read' | 'replied' | 'closed'
      )

      if (result.success) {
        toast({ description: result.message })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {t(s.charAt(0).toUpperCase() + s.slice(1))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleUpdateStatus}
        disabled={isPending || status === currentStatus}
        size="sm"
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t('Apply')
        )}
      </Button>
    </div>
  )
}
