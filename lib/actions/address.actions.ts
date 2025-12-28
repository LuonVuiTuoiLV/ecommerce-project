'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectToDatabase } from '../db'
import Address, { IAddress } from '../db/models/address.model'
import { formatError } from '../utils'
import { VietnamAddressSchema } from '../validator'

// Extended schema for address with isDefault
const AddressInputSchema = VietnamAddressSchema.extend({
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof AddressInputSchema>

const MAX_ADDRESSES_PER_USER = 10

// Get all addresses for current user
export async function getUserAddresses() {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in', data: [] }
    }

    const addresses = await Address.find({ user: session.user.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return {
      success: true,
      data: JSON.parse(JSON.stringify(addresses)) as IAddress[],
    }
  } catch (error) {
    return { success: false, message: formatError(error), data: [] }
  }
}

// Get default address for current user
export async function getDefaultAddress() {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in', data: null }
    }

    const address = await Address.findOne({
      user: session.user.id,
      isDefault: true,
    }).lean()

    // If no default, get the most recent one
    if (!address) {
      const recentAddress = await Address.findOne({ user: session.user.id })
        .sort({ createdAt: -1 })
        .lean()
      return {
        success: true,
        data: recentAddress
          ? (JSON.parse(JSON.stringify(recentAddress)) as IAddress)
          : null,
      }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(address)) as IAddress,
    }
  } catch (error) {
    return { success: false, message: formatError(error), data: null }
  }
}

// Get address by ID
export async function getAddressById(addressId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in', data: null }
    }

    const address = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    }).lean()

    if (!address) {
      return { success: false, message: 'Address not found', data: null }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(address)) as IAddress,
    }
  } catch (error) {
    return { success: false, message: formatError(error), data: null }
  }
}

// Create new address
export async function createAddress(data: AddressInput) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    const validatedData = AddressInputSchema.parse(data)

    // Check address limit
    const addressCount = await Address.countDocuments({ user: session.user.id })
    if (addressCount >= MAX_ADDRESSES_PER_USER) {
      return { 
        success: false, 
        message: `Maximum of ${MAX_ADDRESSES_PER_USER} addresses allowed` 
      }
    }

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: session.user.id },
        { isDefault: false }
      )
    }

    // If this is the first address, make it default
    if (addressCount === 0) {
      validatedData.isDefault = true
    }

    const address = await Address.create({
      ...validatedData,
      user: session.user.id,
    })

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return {
      success: true,
      message: 'Address created successfully',
      data: JSON.parse(JSON.stringify(address)) as IAddress,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Update address
export async function updateAddress(addressId: string, data: AddressInput) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    const validatedData = AddressInputSchema.parse(data)

    // Check if address belongs to user
    const existingAddress = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    })

    if (!existingAddress) {
      return { success: false, message: 'Address not found' }
    }

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: session.user.id, _id: { $ne: addressId } },
        { isDefault: false }
      )
    }

    // Prevent unsetting default if it's the only address
    if (!validatedData.isDefault && existingAddress.isDefault) {
      const addressCount = await Address.countDocuments({ user: session.user.id })
      if (addressCount === 1) {
        validatedData.isDefault = true
      }
    }

    const address = await Address.findByIdAndUpdate(
      addressId,
      validatedData,
      { new: true }
    ).lean()

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return {
      success: true,
      message: 'Address updated successfully',
      data: JSON.parse(JSON.stringify(address)) as IAddress,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Delete address
export async function deleteAddress(addressId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    // Check if address belongs to user
    const address = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    })

    if (!address) {
      return { success: false, message: 'Address not found' }
    }

    const wasDefault = address.isDefault

    await Address.findByIdAndDelete(addressId)

    // If deleted address was default, set another one as default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ user: session.user.id })
        .sort({ createdAt: -1 })
      if (nextAddress) {
        nextAddress.isDefault = true
        await nextAddress.save()
      }
    }

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return {
      success: true,
      message: 'Address deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Set address as default
export async function setDefaultAddress(addressId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    // Check if address belongs to user
    const address = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    })

    if (!address) {
      return { success: false, message: 'Address not found' }
    }

    // Unset all other defaults
    await Address.updateMany(
      { user: session.user.id },
      { isDefault: false }
    )

    // Set this one as default
    address.isDefault = true
    await address.save()

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return {
      success: true,
      message: 'Default address updated',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get address count for user
export async function getAddressCount() {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, count: 0, max: MAX_ADDRESSES_PER_USER }
    }

    const count = await Address.countDocuments({ user: session.user.id })
    return { 
      success: true, 
      count, 
      max: MAX_ADDRESSES_PER_USER,
      canAddMore: count < MAX_ADDRESSES_PER_USER 
    }
  } catch {
    return { success: false, count: 0, max: MAX_ADDRESSES_PER_USER }
  }
}
