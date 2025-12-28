'use server'

import { auth } from '@/auth'
import { sendBackInStockNotification } from '@/emails'
import { connectToDatabase } from '@/lib/db'
import Product, { IProduct } from '@/lib/db/models/product.model'
import { IProductInput } from '@/types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import StockNotification from '../db/models/stock-notification.model'
import { formatError } from '../utils'
import { ProductInputSchema, ProductUpdateSchema } from '../validator'
import { getSetting } from './setting.actions'

// Cache for categories (resets on server restart)
const globalForCategories = global as unknown as {
  cachedCategories: string[] | null
  categoriesCacheTime: number | null
}
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// CREATE
export async function createProduct(data: IProductInput) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    const product = ProductInputSchema.parse(data)
    await connectToDatabase()
    await Product.create(product)
    invalidateCategoriesCache() // Invalidate cache when new product created
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    const product = ProductUpdateSchema.parse(data)
    await connectToDatabase()
    
    // Get old product to check stock change
    const oldProduct = await Product.findById(product._id)
    const wasOutOfStock = oldProduct && oldProduct.countInStock === 0
    const isNowInStock = product.countInStock > 0
    
    await Product.findByIdAndUpdate(product._id, product)
    invalidateCategoriesCache() // Invalidate cache when product updated
    
    // If product was out of stock and now has stock, notify subscribers
    if (wasOutOfStock && isNowInStock) {
      // Run notification in background, don't block the response
      notifyStockSubscribers(product._id, oldProduct).catch(console.error)
    }
    
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Notify subscribers when product is back in stock
async function notifyStockSubscribers(productId: string, product: IProduct) {
  try {
    // Get pending notifications for this product
    const notifications = await StockNotification.find({
      product: productId,
      isNotified: false,
    })

    if (notifications.length === 0) return

    // Get site settings for email
    const { site } = await getSetting()

    // Track successful and failed notifications
    const results: { email: string; success: boolean; error?: string }[] = []

    // Send email to each subscriber with retry logic
    for (const notification of notifications) {
      let success = false
      let lastError = ''
      
      // Retry up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await sendBackInStockNotification({
            email: notification.email,
            productName: notification.productName,
            productSlug: notification.productSlug,
            productImage: product.images?.[0],
            siteUrl: site.url,
            siteName: site.name,
          })
          success = true
          break
        } catch (emailError) {
          lastError = emailError instanceof Error ? emailError.message : 'Unknown error'
          console.error(`Attempt ${attempt}/3 failed for ${notification.email}:`, lastError)
          
          // Wait before retry (exponential backoff)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          }
        }
      }
      
      results.push({ email: notification.email, success, error: success ? undefined : lastError })
      
      // Only mark as notified if email was sent successfully
      if (success) {
        await StockNotification.updateOne(
          { _id: notification._id },
          { isNotified: true, notifiedAt: new Date() }
        )
      }
    }

    // Log summary
    const failCount = results.filter(r => !r.success).length
    
    if (failCount > 0) {
      console.error('Failed notifications:', results.filter(r => !r.success))
    }
  } catch (error) {
    console.error('Error notifying stock subscribers:', error)
  }
}
// DELETE
export async function deleteProduct(id: string) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const res = await Product.findByIdAndDelete(id)
    if (!res) throw new Error('Product not found')
    invalidateCategoriesCache() // Invalidate cache when product deleted
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// GET ONE PRODUCT BY ID
export async function getProductById(productId: string) {
  await connectToDatabase()
  const product = await Product.findById(productId)
  return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET ALL PRODUCTS FOR ADMIN
export async function getAllProductsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await connectToDatabase()

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const products = await Product.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
  }
}

export async function getAllCategories() {
  const now = Date.now()
  
  // Check if cache is valid
  if (
    globalForCategories.cachedCategories &&
    globalForCategories.categoriesCacheTime &&
    now - globalForCategories.categoriesCacheTime < CATEGORIES_CACHE_TTL
  ) {
    return globalForCategories.cachedCategories
  }
  
  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )
  
  // Update cache
  globalForCategories.cachedCategories = categories
  globalForCategories.categoriesCacheTime = now
  
  return categories
}

// Invalidate categories cache (call when products are created/updated/deleted)
function invalidateCategoriesCache() {
  globalForCategories.cachedCategories = null
  globalForCategories.categoriesCacheTime = null
}
export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
}
// GET PRODUCTS BY TAG
export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET ONE PRODUCT BY SLUG
export async function getProductBySlug(slug: string) {
  await connectToDatabase()
  const product = await Product.findOne({ slug, isPublished: true })
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as IProduct
}
// GET RELATED PRODUCTS: PRODUCTS WITH SAME CATEGORY
export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }
  const products = await Product.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const productsCount = await Product.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(productsCount / limit),
  }
}

// GET ALL PRODUCTS
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  category: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}
  const categoryFilter = category && category !== 'all' ? { category } : {}
  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {}
  // 10-50
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}
  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const isPublished = { isPublished: true }
  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
  }
}

export async function getAllTags() {
  const tags = await Product.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])
  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}
