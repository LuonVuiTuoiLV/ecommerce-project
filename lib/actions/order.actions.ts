'use server'

import { auth } from '@/auth'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { DateRange } from 'react-day-picker'
import { connectToDatabase } from '../db'
import Coupon from '../db/models/coupon.model'
import Order, { IOrder } from '../db/models/order.model'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import {
    createReservation,
    getEffectiveStock,
    releaseUserReservations
} from '../inventory-reservation'
import { paypal } from '../paypal'
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '../rate-limit'
import { formatError, round2 } from '../utils'
import { OrderInputSchema } from '../validator'
import { incrementCouponUsage } from './coupon.actions'
import { getSetting } from './setting.actions'

// CREATE
export const createOrder = async (clientSideCart: Cart & { coupon?: { code: string; discountAmount: number } }, couponCode?: string) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')
    
    // Rate limiting - prevent order spam
    const headersList = await headers()
    const clientId = getClientIdentifier(headersList)
    const rateLimitResult = checkRateLimit(`order:${session.user.id || clientId}`, RateLimitPresets.order)
    
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: `Bạn đã tạo quá nhiều đơn hàng. Vui lòng thử lại sau ${rateLimitResult.resetIn} giây.`,
      }
    }

    // Validate stock availability with reservation system
    const stockValidation = await validateAndReserveStock(
      clientSideCart.items,
      session.user.id!
    )
    
    if (!stockValidation.success) {
      return {
        success: false,
        message: stockValidation.message,
      }
    }
    
    // Validate coupon on server-side if provided
    let validatedDiscount = 0
    let validatedCouponCode: string | undefined
    
    if (couponCode) {
      const categories = [...new Set(clientSideCart.items.map(item => item.category))]
      const itemsPrice = clientSideCart.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
      const couponResult = await validateCouponInternal(couponCode, itemsPrice, categories, session.user.id)
      
      if (couponResult.success && couponResult.data) {
        validatedDiscount = couponResult.data.discountAmount
        validatedCouponCode = couponResult.data.code
      }
    }
    
    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!,
      validatedCouponCode,
      validatedDiscount
    )

    // Release reservations after order is created (stock will be deducted on payment)
    releaseUserReservations(session.user.id!)
    
    // Increment coupon usage if coupon was applied (with user tracking)
    if (validatedCouponCode) {
      await incrementCouponUsage(validatedCouponCode, session.user.id)
    }
    
    return {
      success: true,
      message: 'Order placed successfully',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Validate stock and create reservations
async function validateAndReserveStock(
  items: OrderItem[],
  userId: string
): Promise<{ success: boolean; message: string }> {
  // Release any existing reservations for this user first
  releaseUserReservations(userId)
  
  // Bulk fetch all products at once (avoid N+1 query)
  const productIds = items.map(item => item.product)
  const products = await Product.find({ _id: { $in: productIds } })
    .select('_id name countInStock')
    .lean()
  
  // Create a map for quick lookup
  const productMap = new Map(products.map(p => [p._id.toString(), p]))
  
  const outOfStockItems: string[] = []
  
  for (const item of items) {
    const product = productMap.get(item.product)
    
    if (!product) {
      return {
        success: false,
        message: `Sản phẩm "${item.name}" không tồn tại`,
      }
    }
    
    // Check effective stock (actual - reserved by others)
    const effectiveStock = getEffectiveStock(item.product, product.countInStock)
    
    if (effectiveStock < item.quantity) {
      outOfStockItems.push(`${item.name} (còn ${effectiveStock})`)
      continue
    }
    
    // Create reservation
    const reservationKey = createReservation(
      item.product,
      item.quantity,
      userId,
      product.countInStock
    )
    
    if (!reservationKey) {
      outOfStockItems.push(`${item.name} (hết hàng)`)
    }
  }
  
  if (outOfStockItems.length > 0) {
    // Release any reservations we made
    releaseUserReservations(userId)
    return {
      success: false,
      message: `Không đủ số lượng: ${outOfStockItems.join(', ')}`,
    }
  }
  
  return { success: true, message: '' }
}

// Internal coupon validation (without auth check since we already have session)
async function validateCouponInternal(code: string, orderTotal: number, categories: string[], userId?: string) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })

  if (!coupon) {
    return { success: false, message: 'Invalid coupon code' }
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return { success: false, message: 'This coupon is no longer active' }
  }

  // Check date validity
  const now = new Date()
  if (now < coupon.startDate || now > coupon.endDate) {
    return { success: false, message: 'This coupon has expired' }
  }

  // Check usage limit
  if (coupon.usedCount >= coupon.usageLimit) {
    return { success: false, message: 'This coupon has reached its usage limit' }
  }

  // Check per-user usage limit
  if (userId && coupon.usedBy && coupon.usagePerUser) {
    const userUsageCount = coupon.usedBy.filter(
      (usage: { user: string }) => usage.user === userId
    ).length
    if (userUsageCount >= coupon.usagePerUser) {
      return { success: false, message: 'You have already used this coupon the maximum number of times' }
    }
  }

  // Check minimum order value
  if (orderTotal < coupon.minOrderValue) {
    return { success: false, message: `Minimum order value is ${coupon.minOrderValue}` }
  }

  // Check applicable categories
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasApplicableCategory = categories.some((cat) =>
      coupon.applicableCategories!.includes(cat)
    )
    if (!hasApplicableCategory) {
      return { success: false, message: 'This coupon is not applicable to items in your cart' }
    }
  }

  // Calculate discount
  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderTotal * coupon.discountValue) / 100
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else {
    discountAmount = coupon.discountValue
  }

  // Ensure discount doesn't exceed order total
  if (discountAmount > orderTotal) {
    discountAmount = orderTotal
  }

  return {
    success: true,
    data: {
      code: coupon.code,
      discountAmount: round2(discountAmount),
    },
  }
}

export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string,
  couponCode?: string,
  discountAmount: number = 0
) => {
  const priceData = await calcDeliveryDateAndPrice({
    items: clientSideCart.items,
    shippingAddress: clientSideCart.shippingAddress,
    deliveryDateIndex: clientSideCart.deliveryDateIndex,
  })

  // Calculate final total with discount
  const finalTotalPrice = round2(Math.max(0, priceData.totalPrice - discountAmount))

  const order = OrderInputSchema.parse({
    user: userId,
    items: clientSideCart.items,
    shippingAddress: clientSideCart.shippingAddress,
    paymentMethod: clientSideCart.paymentMethod,
    itemsPrice: priceData.itemsPrice,
    shippingPrice: priceData.shippingPrice,
    taxPrice: priceData.taxPrice,
    totalPrice: finalTotalPrice,
    couponCode,
    discountAmount,
    expectedDeliveryDate: clientSideCart.expectedDeliveryDate,
  })
  return await Order.create(order)
}

export async function updateOrderToPaid(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()
    
    // Always update stock (removed localhost check - transactions work with replica sets)
    await updateProductStock(order._id)
    
    if (order.user.email) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (orderId: string) => {
  // Check if MongoDB supports transactions (requires replica set)
  const isReplicaSet = mongoose.connection.readyState === 1 && 
    mongoose.connection.db?.admin !== undefined

  if (isReplicaSet) {
    // Use transaction for atomic updates
    const session = await mongoose.connection.startSession()
    try {
      session.startTransaction()
      const opts = { session }

      const order = await Order.findById(orderId).session(session)
      if (!order) throw new Error('Order not found')

      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session)
        if (!product) throw new Error('Product not found')

        if (product.countInStock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`)
        }

        await Product.updateOne(
          { _id: product._id },
          { $inc: { countInStock: -item.quantity, numSales: item.quantity } },
          opts
        )
      }
      await session.commitTransaction()
      session.endSession()
      return true
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  } else {
    // Fallback for non-replica set (development)
    const order = await Order.findById(orderId)
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, countInStock: { $gte: item.quantity } },
        { $inc: { countInStock: -item.quantity, numSales: item.quantity } }
      )
    }
    return true
  }
}
export async function deliverOrder(orderId: string) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const res = await Order.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'Order deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  const order = await Order.findById(orderId)
  return JSON.parse(JSON.stringify(order))
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (order) {
      const paypalOrder = await paypal.createOrder(order.totalPrice)
      order.paymentResult = {
        id: paypalOrder.id,
        email_address: '',
        status: '',
        pricePaid: '0',
      }
      await order.save()
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      }
    } else {
      throw new Error('Order not found')
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId).populate('user', 'email')
    if (!order) throw new Error('Order not found')

    const captureData = await paypal.capturePayment(data.orderID)
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    )
      throw new Error('Error in paypal payment')
    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = await getSetting()
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.15)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}
