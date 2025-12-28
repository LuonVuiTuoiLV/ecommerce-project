'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectToDatabase } from '../db'
import Coupon, { ICoupon } from '../db/models/coupon.model'
import { formatError } from '../utils'
import { CouponInputSchema, CouponUpdateSchema } from '../validator'

// CREATE
export async function createCoupon(data: z.infer<typeof CouponInputSchema>) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    const coupon = CouponInputSchema.parse(data)
    await connectToDatabase()

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: coupon.code })
    if (existingCoupon) {
      return { success: false, message: 'Coupon code already exists' }
    }

    await Coupon.create(coupon)
    revalidatePath('/admin/coupons')
    return {
      success: true,
      message: 'Coupon created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateCoupon(data: z.infer<typeof CouponUpdateSchema>) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    const coupon = CouponUpdateSchema.parse(data)
    await connectToDatabase()

    // Check if code is being changed and if new code already exists
    const existingCoupon = await Coupon.findById(coupon._id)
    if (!existingCoupon) {
      return { success: false, message: 'Coupon not found' }
    }

    if (existingCoupon.code !== coupon.code) {
      const duplicateCoupon = await Coupon.findOne({ code: coupon.code })
      if (duplicateCoupon) {
        return { success: false, message: 'Coupon code already exists' }
      }
    }

    await Coupon.findByIdAndUpdate(coupon._id, coupon)
    revalidatePath('/admin/coupons')
    return {
      success: true,
      message: 'Coupon updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteCoupon(id: string) {
  try {
    // Admin authorization check
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    const res = await Coupon.findByIdAndDelete(id)
    if (!res) throw new Error('Coupon not found')
    revalidatePath('/admin/coupons')
    return {
      success: true,
      message: 'Coupon deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ONE BY ID
export async function getCouponById(id: string) {
  await connectToDatabase()
  const coupon = await Coupon.findById(id)
  return JSON.parse(JSON.stringify(coupon)) as ICoupon
}

// GET ALL COUPONS FOR ADMIN
export async function getAllCoupons({
  query,
  page = 1,
  limit = 10,
}: {
  query?: string
  page?: number
  limit?: number
}) {
  await connectToDatabase()

  const queryFilter = query
    ? {
        $or: [
          { code: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      }
    : {}

  const coupons = await Coupon.find(queryFilter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  const totalCoupons = await Coupon.countDocuments(queryFilter)

  return {
    data: JSON.parse(JSON.stringify(coupons)) as ICoupon[],
    totalPages: Math.ceil(totalCoupons / limit),
    totalCoupons,
  }
}

// VALIDATE COUPON (for checkout)
export async function validateCoupon(code: string, orderTotal: number, categories?: string[]) {
  try {
    await connectToDatabase()
    const session = await auth()

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
    if (now < coupon.startDate) {
      return { success: false, message: 'This coupon is not yet valid' }
    }
    if (now > coupon.endDate) {
      return { success: false, message: 'This coupon has expired' }
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return { success: false, message: 'This coupon has reached its usage limit' }
    }

    // Check per-user usage limit (only for logged in users)
    if (session?.user?.id && coupon.usedBy && coupon.usagePerUser) {
      const userUsageCount = coupon.usedBy.filter(
        (usage) => usage.user === session.user.id
      ).length
      if (userUsageCount >= coupon.usagePerUser) {
        return {
          success: false,
          message: 'You have already used this coupon the maximum number of times',
        }
      }
    }

    // Check minimum order value
    if (orderTotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value is ${coupon.minOrderValue}`,
      }
    }

    // Check applicable categories
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && categories) {
      const hasApplicableCategory = categories.some((cat) =>
        coupon.applicableCategories!.includes(cat)
      )
      if (!hasApplicableCategory) {
        return {
          success: false,
          message: 'This coupon is not applicable to items in your cart',
        }
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * coupon.discountValue) / 100
      // Apply max discount cap if set
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
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: coupon.description,
      },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// INCREMENT COUPON USAGE (call after successful order)
export async function incrementCouponUsage(code: string, userId?: string) {
  try {
    await connectToDatabase()
    
    const updateQuery: {
      $inc: { usedCount: number }
      $push?: { usedBy: { user: string; usedAt: Date } }
    } = {
      $inc: { usedCount: 1 },
    }

    // Track user usage if userId is provided
    if (userId) {
      updateQuery.$push = {
        usedBy: { user: userId, usedAt: new Date() },
      }
    }

    await Coupon.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      updateQuery
    )
    return { success: true }
  } catch (error) {
    console.error('Error incrementing coupon usage:', error)
    return { success: false }
  }
}

// GET AVAILABLE COUPONS FOR USER (for checkout discovery)
export async function getAvailableCoupons(orderTotal: number, categories?: string[]) {
  try {
    await connectToDatabase()
    const session = await auth()
    const now = new Date()

    // Find active coupons that are currently valid
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    })
      .sort({ discountValue: -1 })
      .limit(5)
      .lean()

    // Filter and calculate potential discount for each coupon
    const availableCoupons = []

    for (const coupon of coupons) {
      // Check per-user usage limit
      if (session?.user?.id && coupon.usedBy && coupon.usagePerUser) {
        const userUsageCount = coupon.usedBy.filter(
          (usage: { user: string }) => usage.user === session.user.id
        ).length
        if (userUsageCount >= coupon.usagePerUser) {
          continue // Skip this coupon
        }
      }

      // Check applicable categories
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && categories) {
        const hasApplicableCategory = categories.some((cat) =>
          coupon.applicableCategories!.includes(cat)
        )
        if (!hasApplicableCategory) {
          continue // Skip this coupon
        }
      }

      // Calculate potential discount
      let potentialDiscount = 0
      const isApplicable = orderTotal >= coupon.minOrderValue

      if (isApplicable) {
        if (coupon.discountType === 'percentage') {
          potentialDiscount = (orderTotal * coupon.discountValue) / 100
          if (coupon.maxDiscount && potentialDiscount > coupon.maxDiscount) {
            potentialDiscount = coupon.maxDiscount
          }
        } else {
          potentialDiscount = coupon.discountValue
        }
      }

      availableCoupons.push({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        potentialDiscount: Math.round(potentialDiscount * 100) / 100,
        isApplicable,
        endDate: coupon.endDate,
      })
    }

    return {
      success: true,
      data: availableCoupons,
    }
  } catch (error) {
    return { success: false, message: formatError(error), data: [] }
  }
}
