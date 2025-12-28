'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
    deleteAddress,
    getUserAddresses,
    setDefaultAddress,
} from '@/lib/actions/address.actions'
import { IAddress } from '@/lib/db/models/address.model'
import { MapPin, Phone, Plus, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import AddressForm from './address-form'

const MAX_ADDRESSES = 10

export default function AddressList() {
  const t = useTranslations('Account')
  const tAdmin = useTranslations('Admin')
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<IAddress | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  const fetchAddresses = async () => {
    setLoading(true)
    const result = await getUserAddresses()
    if (result.success) {
      setAddresses(result.data)
    } else {
      toast({ variant: 'destructive', description: result.message })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEdit = (address: IAddress) => {
    setEditingAddress(address)
    setFormOpen(true)
  }

  const handleAdd = () => {
    if (addresses.length >= MAX_ADDRESSES) {
      toast({
        variant: 'destructive',
        description: t('Maximum addresses reached', { max: MAX_ADDRESSES }),
      })
      return
    }
    setEditingAddress(null)
    setFormOpen(true)
  }

  const handleDeleteClick = (address: IAddress) => {
    setAddressToDelete(address)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return
    
    setIsDeleting(true)
    const result = await deleteAddress(addressToDelete._id)
    if (result.success) {
      toast({ description: result.message })
      fetchAddresses()
    } else {
      toast({ variant: 'destructive', description: result.message })
    }
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setAddressToDelete(null)
  }

  const handleSetDefault = async (addressId: string) => {
    setSettingDefault(addressId)
    const result = await setDefaultAddress(addressId)
    if (result.success) {
      toast({ description: result.message })
      fetchAddresses()
    } else {
      toast({ variant: 'destructive', description: result.message })
    }
    setSettingDefault(null)
  }

  // Loading skeleton - Shopee style
  if (loading) {
    return (
      <div className='space-y-4'>
        {[1, 2].map((i) => (
          <div key={i} className='animate-pulse border rounded-lg p-5'>
            <div className='flex gap-4'>
              <div className='flex-1'>
                <div className='h-5 bg-muted rounded w-1/3 mb-3' />
                <div className='h-4 bg-muted rounded w-full mb-2' />
                <div className='h-4 bg-muted rounded w-2/3' />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Header with Add button - Shopee style */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          {addresses.length > 0 && (
            <span>
              {t('addresses count', { count: addresses.length })} / {MAX_ADDRESSES}
            </span>
          )}
        </div>
        <Button 
          onClick={handleAdd}
          variant='outline'
          className='border-primary text-primary hover:bg-primary hover:text-primary-foreground'
          disabled={addresses.length >= MAX_ADDRESSES}
        >
          <Plus className='h-4 w-4 mr-2' />
          {t('Add New Address')}
        </Button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 ? (
        <div className='border-2 border-dashed rounded-lg p-12 text-center'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
            <MapPin className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='font-medium text-lg mb-2'>{t('No addresses yet')}</h3>
          <p className='text-muted-foreground text-sm mb-6 max-w-sm mx-auto'>
            {t('Add your first address to get started')}
          </p>
          <Button onClick={handleAdd} size='lg'>
            <Plus className='h-4 w-4 mr-2' />
            {t('Add New Address')}
          </Button>
        </div>
      ) : (
        /* Address list - Shopee style */
        <div className='space-y-4'>
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`relative border rounded-lg transition-all ${
                address.isDefault 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              {/* Default badge - positioned at top right */}
              {address.isDefault && (
                <div className='absolute -top-px -right-px'>
                  <span className='inline-flex items-center px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-bl-lg rounded-tr-lg'>
                    {t('Default')}
                  </span>
                </div>
              )}

              <div className='p-5'>
                {/* Name and Phone row */}
                <div className='flex items-center gap-3 mb-3'>
                  <div className='flex items-center gap-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span className='font-semibold text-base'>{address.fullName}</span>
                  </div>
                  <Separator orientation='vertical' className='h-4' />
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Phone className='h-4 w-4' />
                    <span>{address.phone}</span>
                  </div>
                </div>

                {/* Address details */}
                <div className='flex items-start gap-2 text-sm text-muted-foreground mb-4'>
                  <MapPin className='h-4 w-4 mt-0.5 flex-shrink-0' />
                  <div>
                    <p>{address.street}</p>
                    <p>{[address.wardName, address.provinceName].filter(Boolean).join(', ')}</p>
                  </div>
                </div>

                {/* Action buttons - Shopee style */}
                <div className='flex items-center gap-3 pt-3 border-t'>
                  <Button
                    variant='link'
                    size='sm'
                    className='h-auto p-0 text-primary'
                    onClick={() => handleEdit(address)}
                  >
                    {t('Edit')}
                  </Button>
                  
                  {!address.isDefault && (
                    <>
                      <Separator orientation='vertical' className='h-4' />
                      <Button
                        variant='link'
                        size='sm'
                        className='h-auto p-0 text-destructive hover:text-destructive'
                        onClick={() => handleDeleteClick(address)}
                      >
                        {t('Delete')}
                      </Button>
                    </>
                  )}

                  {!address.isDefault && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='ml-auto'
                      onClick={() => handleSetDefault(address._id)}
                      disabled={settingDefault === address._id}
                    >
                      {settingDefault === address._id ? (
                        <span className='flex items-center gap-2'>
                          <span className='h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                          {t('Set as default')}
                        </span>
                      ) : (
                        t('Set as default')
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address limit warning */}
      {addresses.length >= MAX_ADDRESSES && (
        <p className='text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg'>
          {t('Maximum addresses reached', { max: MAX_ADDRESSES })}
        </p>
      )}

      <AddressForm
        open={formOpen}
        onOpenChange={setFormOpen}
        address={editingAddress}
        onSuccess={fetchAddresses}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('Are you sure you want to delete this address?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('Delete address confirmation', { name: addressToDelete?.fullName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? tAdmin('Deleting') : t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
