'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '../db'
import Wishlist from '../db/models/wishlist.model'
import { formatError } from '../utils'

// Get user's wishlist
export async function getWishlist() {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: true, data: [] }
    }

    const wishlist = await Wishlist.findOne({ user: session.user.id })
      .populate({
        path: 'items.product',
        select: 'name slug images price listPrice countInStock brand category avgRating numReviews tags sizes colors',
      })
      .lean()

    if (!wishlist) {
      return { success: true, data: [] }
    }

    // Filter out null products (deleted products)
    const validItems = wishlist.items.filter((item: { product: unknown }) => item.product !== null)

    return {
      success: true,
      data: JSON.parse(JSON.stringify(validItems)),
    }
  } catch (error) {
    return { success: false, message: formatError(error), data: [] }
  }
}

// Get wishlist product IDs only (for checking if product is in wishlist)
export async function getWishlistProductIds(): Promise<string[]> {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const wishlist = await Wishlist.findOne({ user: session.user.id })
      .select('items.product')
      .lean()

    if (!wishlist) {
      return []
    }

    return wishlist.items.map((item: { product: unknown }) => String(item.product))
  } catch (error) {
    console.error('Error getting wishlist IDs:', error)
    return []
  }
}

// Add product to wishlist
export async function addToWishlist(productId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in to add to wishlist' }
    }

    let wishlist = await Wishlist.findOne({ user: session.user.id })

    if (!wishlist) {
      // Create new wishlist
      wishlist = await Wishlist.create({
        user: session.user.id,
        items: [{ product: productId, addedAt: new Date() }],
      })
    } else {
      // Check if product already exists
      const existingItem = wishlist.items.find(
        (item: { product: unknown }) => String(item.product) === productId
      )

      if (existingItem) {
        return { success: false, message: 'Product already in wishlist' }
      }

      // Add new product
      wishlist.items.push({ product: productId, addedAt: new Date() })
      await wishlist.save()
    }

    revalidatePath('/wishlist')
    return { success: true, message: 'Added to wishlist' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Remove product from wishlist
export async function removeFromWishlist(productId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    const wishlist = await Wishlist.findOne({ user: session.user.id })

    if (!wishlist) {
      return { success: false, message: 'Wishlist not found' }
    }

    wishlist.items = wishlist.items.filter(
      (item: { product: unknown }) => String(item.product) !== productId
    )
    await wishlist.save()

    revalidatePath('/wishlist')
    return { success: true, message: 'Removed from wishlist' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Toggle wishlist (add if not exists, remove if exists)
export async function toggleWishlist(productId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in to add to wishlist', action: 'none' }
    }

    const wishlist = await Wishlist.findOne({ user: session.user.id })

    if (!wishlist) {
      // Create new wishlist with product
      await Wishlist.create({
        user: session.user.id,
        items: [{ product: productId, addedAt: new Date() }],
      })
      revalidatePath('/wishlist')
      return { success: true, message: 'Added to wishlist', action: 'added' }
    }

    const existingIndex = wishlist.items.findIndex(
      (item: { product: unknown }) => String(item.product) === productId
    )

    if (existingIndex > -1) {
      // Remove from wishlist
      wishlist.items.splice(existingIndex, 1)
      await wishlist.save()
      revalidatePath('/wishlist')
      return { success: true, message: 'Removed from wishlist', action: 'removed' }
    } else {
      // Add to wishlist
      wishlist.items.push({ product: productId, addedAt: new Date() })
      await wishlist.save()
      revalidatePath('/wishlist')
      return { success: true, message: 'Added to wishlist', action: 'added' }
    }
  } catch (error) {
    return { success: false, message: formatError(error), action: 'none' }
  }
}

// Clear entire wishlist
export async function clearWishlist() {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    await Wishlist.findOneAndUpdate(
      { user: session.user.id },
      { items: [] }
    )

    revalidatePath('/wishlist')
    return { success: true, message: 'Wishlist cleared' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get wishlist count
export async function getWishlistCount(): Promise<number> {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return 0
    }

    const wishlist = await Wishlist.findOne({ user: session.user.id })
      .select('items')
      .lean()

    return wishlist?.items?.length || 0
  } catch (error) {
    console.error('Error getting wishlist count:', error)
    return 0
  }
}

// Admin: Get all wishlists
export async function getAllWishlists({
  page = 1,
  limit = 20,
}: {
  page?: number
  limit?: number
}) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      throw new Error('Unauthorized')
    }

    const skipAmount = (page - 1) * limit

    // Get all wishlists with populated user and product data
    const wishlists = await Wishlist.find()
      .populate('user', 'name email')
      .populate('items.product', 'name slug price images')
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit)
      .lean()

    // Flatten the data structure for easier display
    const flattenedData: {
      _id: string
      user: { _id: string; name: string; email: string }
      product: { _id: string; name: string; slug: string; price: number }
      createdAt: Date
    }[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wishlists.forEach((wishlist: any) => {
      if (wishlist.items && Array.isArray(wishlist.items)) {
        wishlist.items.forEach((item: { product: { _id: string; name: string; slug: string; price: number }; addedAt: Date }) => {
          if (item.product) {
            flattenedData.push({
              _id: String(wishlist._id) + '-' + String(item.product._id),
              user: wishlist.user,
              product: item.product,
              createdAt: item.addedAt,
            })
          }
        })
      }
    })

    // Count total wishlist items
    const totalWishlists = await Wishlist.aggregate([
      { $unwind: '$items' },
      { $count: 'total' },
    ])
    const total = totalWishlists[0]?.total || 0

    return {
      success: true,
      data: JSON.parse(JSON.stringify(flattenedData)),
      totalPages: Math.ceil(total / limit),
      totalWishlists: total,
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      data: [],
      totalPages: 0,
      totalWishlists: 0,
    }
  }
}

// Migrate local wishlist items to server (called after login)
export async function migrateLocalWishlist(productIds: string[]) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Please sign in' }
    }

    if (!productIds || productIds.length === 0) {
      return { success: true, message: 'No items to migrate', migratedCount: 0 }
    }

    let wishlist = await Wishlist.findOne({ user: session.user.id })

    if (!wishlist) {
      // Create new wishlist with all items
      wishlist = await Wishlist.create({
        user: session.user.id,
        items: productIds.map((productId) => ({
          product: productId,
          addedAt: new Date(),
        })),
      })
      return { success: true, message: 'Wishlist migrated', migratedCount: productIds.length }
    }

    // Add items that don't already exist
    const existingProductIds = wishlist.items.map((item: { product: unknown }) => 
      String(item.product)
    )
    
    const newItems = productIds.filter((id) => !existingProductIds.includes(id))
    
    if (newItems.length > 0) {
      wishlist.items.push(
        ...newItems.map((productId) => ({
          product: productId,
          addedAt: new Date(),
        }))
      )
      await wishlist.save()
    }

    revalidatePath('/wishlist')
    return { 
      success: true, 
      message: `Migrated ${newItems.length} items`, 
      migratedCount: newItems.length 
    }
  } catch (error) {
    return { success: false, message: formatError(error), migratedCount: 0 }
  }
}
