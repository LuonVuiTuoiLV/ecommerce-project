'use server'

import { headers } from 'next/headers'
import { connectToDatabase } from '../db'
import StockNotification from '../db/models/stock-notification.model'
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '../rate-limit'
import { formatError } from '../utils'

// Subscribe to stock notification
export async function subscribeStockNotification({
  email,
  productId,
  productName,
  productSlug,
}: {
  email: string
  productId: string
  productName: string
  productSlug: string
}) {
  try {
    // Rate limiting
    const headersList = await headers()
    const clientId = getClientIdentifier(headersList)
    const rateLimitResult = checkRateLimit(`stock-notify:${clientId}`, RateLimitPresets.notification)
    
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: `Bạn đã đăng ký quá nhiều thông báo. Vui lòng thử lại sau ${Math.ceil(rateLimitResult.resetIn / 60)} phút.`,
      }
    }

    await connectToDatabase()

    // Check if already subscribed
    const existing = await StockNotification.findOne({
      email: email.toLowerCase().trim(),
      product: productId,
    })

    if (existing) {
      if (existing.isNotified) {
        // Reset notification status if they want to subscribe again
        existing.isNotified = false
        existing.notifiedAt = undefined
        await existing.save()
        return { success: true, message: 'Subscribed again' }
      }
      return { success: true, message: 'Already subscribed' }
    }

    await StockNotification.create({
      email: email.toLowerCase().trim(),
      product: productId,
      productName,
      productSlug,
    })

    return { success: true, message: 'Subscribed successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Check if user is subscribed
export async function checkStockSubscription(email: string, productId: string) {
  try {
    await connectToDatabase()

    const subscription = await StockNotification.findOne({
      email: email.toLowerCase().trim(),
      product: productId,
      isNotified: false,
    })

    return { subscribed: !!subscription }
  } catch {
    return { subscribed: false }
  }
}

// Unsubscribe from stock notification
export async function unsubscribeStockNotification(email: string, productId: string) {
  try {
    await connectToDatabase()

    await StockNotification.deleteOne({
      email: email.toLowerCase().trim(),
      product: productId,
    })

    return { success: true, message: 'Unsubscribed successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get pending notifications for a product (for admin/cron job)
export async function getPendingNotifications(productId: string) {
  try {
    await connectToDatabase()

    const notifications = await StockNotification.find({
      product: productId,
      isNotified: false,
    })

    return { success: true, data: notifications }
  } catch (error) {
    return { success: false, message: formatError(error), data: [] }
  }
}

// Mark notifications as sent
export async function markNotificationsSent(productId: string) {
  try {
    await connectToDatabase()

    await StockNotification.updateMany(
      { product: productId, isNotified: false },
      { isNotified: true, notifiedAt: new Date() }
    )

    return { success: true }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
