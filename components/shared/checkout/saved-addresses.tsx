'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createAddress, getUserAddresses } from '@/lib/actions/address.actions'
import { IAddress } from '@/lib/db/models/address.model'
import { ShippingAddress } from '@/types'
import { Loader2, MapPin, Phone, Plus, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface SavedAddressesProps {
  onSelectAddress: (address: ShippingAddress) => void
  onAddNew: () => void
  selectedAddress?: ShippingAddress | null
}

export default function SavedAddresses({
  onSelectAddress,
  onAddNew,
  selectedAddress,
}: SavedAddressesProps) {
  const t = useTranslations('Checkout')
  const tAccount = useTranslations('Account')
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    const result = await getUserAddresses()
    if (result.success && result.data.length > 0) {
      setAddresses(result.data)
      // Auto-select default or first address if no address is selected
      if (!selectedAddress) {
        const defaultAddr = result.data.find((a) => a.isDefault) || result.data[0]
        if (defaultAddr) {
          setSelectedId(defaultAddr._id)
          // Convert to ShippingAddress format (2 cấp)
          // street đã bao gồm địa chỉ chi tiết
          onSelectAddress({
            fullName: defaultAddr.fullName,
            street: defaultAddr.street,
            city: defaultAddr.wardName || defaultAddr.provinceName || '',
            province: defaultAddr.provinceName || '',
            postalCode: '',
            country: defaultAddr.country || 'Việt Nam',
            phone: defaultAddr.phone,
          })
        }
      }
    }
    setLoading(false)
  }, [selectedAddress, onSelectAddress])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleSelectAddress = (addressId: string) => {
    setSelectedId(addressId)
    const address = addresses.find((a) => a._id === addressId)
    if (address) {
      // Convert to ShippingAddress format (2 cấp)
      // street đã bao gồm địa chỉ chi tiết
      onSelectAddress({
        fullName: address.fullName,
        street: address.street,
        city: address.wardName || address.provinceName || '',
        province: address.provinceName || '',
        postalCode: '',
        country: address.country || 'Việt Nam',
        phone: address.phone,
      })
    }
  }

  if (loading) {
    return (
      <div className='space-y-3'>
        {[1, 2].map((i) => (
          <div key={i} className='animate-pulse border rounded-lg p-4'>
            <div className='h-4 bg-muted rounded w-1/3 mb-2' />
            <div className='h-3 bg-muted rounded w-2/3' />
          </div>
        ))}
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className='border-2 border-dashed rounded-lg p-8 text-center'>
        <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center'>
          <MapPin className='h-6 w-6 text-muted-foreground' />
        </div>
        <p className='text-muted-foreground text-sm mb-4'>
          {tAccount('No addresses yet')}
        </p>
        <Button onClick={onAddNew} variant='outline' size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          {t('Add new address')}
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <p className='text-sm font-medium'>
          {t('Select a delivery address')}
        </p>
        <Link 
          href='/account/addresses' 
          className='text-sm text-primary hover:underline'
        >
          {t('Manage addresses')}
        </Link>
      </div>

      <RadioGroup value={selectedId} onValueChange={handleSelectAddress}>
        <div className='space-y-3'>
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`relative border rounded-lg transition-all cursor-pointer ${
                selectedId === address._id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => handleSelectAddress(address._id)}
            >
              {/* Default badge */}
              {address.isDefault && (
                <div className='absolute -top-px -right-px'>
                  <span className='inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-bl-md rounded-tr-md'>
                    {tAccount('Default')}
                  </span>
                </div>
              )}

              <div className='p-4'>
                <div className='flex items-start gap-3'>
                  <RadioGroupItem
                    value={address._id}
                    id={`checkout-address-${address._id}`}
                    className='mt-1'
                  />
                  <Label
                    htmlFor={`checkout-address-${address._id}`}
                    className='flex-1 cursor-pointer'
                  >
                    {/* Name and Phone */}
                    <div className='flex items-center gap-2 mb-2 flex-wrap'>
                      <div className='flex items-center gap-1.5'>
                        <User className='h-3.5 w-3.5 text-muted-foreground' />
                        <span className='font-semibold'>{address.fullName}</span>
                      </div>
                      <Separator orientation='vertical' className='h-4' />
                      <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <Phone className='h-3.5 w-3.5' />
                        <span className='text-sm'>{address.phone}</span>
                      </div>
                    </div>
                    
                    {/* Address */}
                    <div className='text-sm text-muted-foreground'>
                      <p>{address.street}</p>
                      <p>{[address.wardName, address.provinceName].filter(Boolean).join(', ')}</p>
                    </div>
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>

      <Button 
        onClick={onAddNew} 
        variant='outline' 
        className='w-full border-dashed'
      >
        <Plus className='h-4 w-4 mr-2' />
        {t('Add new address')}
      </Button>
    </div>
  )
}

// Component để lưu địa chỉ mới từ checkout (legacy format)
interface SaveAddressCheckboxProps {
  address: ShippingAddress
  onSaved?: () => void
}

export function SaveAddressCheckbox({ address, onSaved }: SaveAddressCheckboxProps) {
  const t = useTranslations('Checkout')
  const { toast } = useToast()
  const [saveAddress, setSaveAddress] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveAddress = async () => {
    if (!saveAddress) return
    
    setIsSaving(true)
    // Convert legacy ShippingAddress to VietnamAddress format (2 cấp)
    const vietnamAddress = {
      fullName: address.fullName,
      phone: address.phone,
      provinceName: address.province || '',
      wardName: address.city || '',
      street: address.street,
      country: address.country || 'Việt Nam',
      isDefault: false,
    }
    
    const result = await createAddress(vietnamAddress)
    
    if (result.success) {
      toast({ description: t('Address saved successfully') })
      onSaved?.()
    } else {
      toast({ variant: 'destructive', description: result.message })
    }
    setIsSaving(false)
  }

  return (
    <div className='flex items-center justify-between gap-3 mt-4 p-3 bg-muted/50 rounded-lg border'>
      <div className='flex items-center gap-2'>
        <Checkbox
          id='save-address'
          checked={saveAddress}
          onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
          disabled={isSaving}
        />
        <Label htmlFor='save-address' className='text-sm cursor-pointer'>
          {t('Save this address for future orders')}
        </Label>
      </div>
      {saveAddress && (
        <Button
          size='sm'
          onClick={handleSaveAddress}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          {t('Save')}
        </Button>
      )}
    </div>
  )
}
