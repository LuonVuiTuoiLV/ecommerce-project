'use server'

import { auth } from '@/auth'
import { sendContactNotification } from '@/emails'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { connectToDatabase } from '../db'
import Contact, { IContact } from '../db/models/contact.model'
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '../rate-limit'
import { formatError } from '../utils'
import { ContactInputSchema } from '../validator'
import { getSetting } from './setting.actions'

// CREATE - Submit contact form
export async function submitContactForm(data: z.infer<typeof ContactInputSchema>) {
  try {
    // Rate limiting
    const headersList = await headers()
    const clientId = getClientIdentifier(headersList)
    const rateLimitResult = checkRateLimit(`contact:${clientId}`, RateLimitPresets.form)
    
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${rateLimitResult.resetIn} giây.`,
      }
    }

    const contact = ContactInputSchema.parse(data)
    await connectToDatabase()

    const newContact = await Contact.create(contact)

    // Send email notification to admin
    try {
      const { site } = await getSetting()
      if (site.email) {
        await sendContactNotification({
          contact: newContact as IContact,
          adminEmail: site.email,
        })
      }
    } catch (emailError) {
      // Log error but don't fail the contact submission
      console.error('Failed to send contact notification email:', emailError)
    }

    return {
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL CONTACTS FOR ADMIN
export async function getAllContacts({
  query,
  status,
  page = 1,
  limit = 10,
}: {
  query?: string
  status?: string
  page?: number
  limit?: number
}) {
  await connectToDatabase()

  const queryFilter: Record<string, unknown> = {}

  if (query) {
    queryFilter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { subject: { $regex: query, $options: 'i' } },
    ]
  }

  if (status && status !== 'all') {
    queryFilter.status = status
  }

  const contacts = await Contact.find(queryFilter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  const totalContacts = await Contact.countDocuments(queryFilter)
  const newCount = await Contact.countDocuments({ status: 'new' })

  return {
    data: JSON.parse(JSON.stringify(contacts)) as IContact[],
    totalPages: Math.ceil(totalContacts / limit),
    totalContacts,
    newCount,
  }
}

// GET ONE BY ID
export async function getContactById(id: string) {
  await connectToDatabase()
  const contact = await Contact.findById(id)
  return contact ? (JSON.parse(JSON.stringify(contact)) as IContact) : null
}

// UPDATE STATUS
export async function updateContactStatus(id: string, status: IContact['status']) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!contact) {
      return { success: false, message: 'Contact not found' }
    }

    revalidatePath('/admin/contacts')
    return {
      success: true,
      message: 'Status updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteContact(id: string) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const res = await Contact.findByIdAndDelete(id)
    if (!res) throw new Error('Contact not found')
    revalidatePath('/admin/contacts')
    return {
      success: true,
      message: 'Contact deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET NEW CONTACTS COUNT (for badge)
export async function getNewContactsCount(): Promise<number> {
  try {
    await connectToDatabase()
    return await Contact.countDocuments({ status: 'new' })
  } catch (error) {
    console.error('Error getting new contacts count:', error)
    return 0
  }
}
