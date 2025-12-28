'use server'

import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'

import { auth } from '@/auth'

import { IReviewDetails } from '@/types'
import { connectToDatabase } from '../db'
import Product from '../db/models/product.model'
import Review, { IReview } from '../db/models/review.model'
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '../rate-limit'
import { formatError } from '../utils'
import { ReviewInputSchema } from '../validator'
import { getSetting } from './setting.actions'

export async function createUpdateReview({
  data,
  path,
}: {
  data: z.infer<typeof ReviewInputSchema>
  path: string
}) {
  try {
    const session = await auth()
    if (!session) {
      throw new Error('User is not authenticated')
    }

    // Rate limiting
    const headersList = await headers()
    const clientId = getClientIdentifier(headersList)
    const rateLimitResult = checkRateLimit(`review:${session.user.id || clientId}`, RateLimitPresets.form)
    
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: `Bạn đã gửi quá nhiều đánh giá. Vui lòng thử lại sau ${rateLimitResult.resetIn} giây.`,
      }
    }

    const review = ReviewInputSchema.parse({
      ...data,
      user: session?.user?.id,
    })

    await connectToDatabase()
    const existReview = await Review.findOne({
      product: review.product,
      user: review.user,
    })

    if (existReview) {
      existReview.comment = review.comment
      existReview.rating = review.rating
      existReview.title = review.title
      await existReview.save()
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
        success: true,
        message: 'Review updated successfully',
        // data: JSON.parse(JSON.stringify(existReview)),
      }
    } else {
      await Review.create(review)
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
        success: true,
        message: 'Review created successfully',
        // data: JSON.parse(JSON.stringify(newReview)),
      }
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

const updateProductReview = async (productId: string) => {
  // Calculate the new average rating, number of reviews, and rating distribution
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ])
  // Calculate the total number of reviews and average rating
  const totalReviews = result.reduce((sum, { count }) => sum + count, 0)
  const avgRating =
    result.reduce((sum, { _id, count }) => sum + _id * count, 0) / totalReviews

  // Convert aggregation result to a map for easier lookup
  const ratingMap = result.reduce((map, { _id, count }) => {
    map[_id] = count
    return map
  }, {})
  // Ensure all ratings 1-5 are represented, with missing ones set to count: 0
  const ratingDistribution = []
  for (let i = 1; i <= 5; i++) {
    ratingDistribution.push({ rating: i, count: ratingMap[i] || 0 })
  }
  // Update product fields with calculated values
  await Product.findByIdAndUpdate(productId, {
    avgRating: avgRating.toFixed(1),
    numReviews: totalReviews,
    ratingDistribution,
  })
}

export async function getReviews({
  productId,
  limit,
  page,
}: {
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (page - 1) * limit
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name')
    .sort({
      createdAt: 'desc',
    })
    .skip(skipAmount)
    .limit(limit)
  const reviewsCount = await Review.countDocuments({ product: productId })
  return {
    data: JSON.parse(JSON.stringify(reviews)) as IReviewDetails[],
    totalPages: reviewsCount === 0 ? 1 : Math.ceil(reviewsCount / limit),
  }
}
export const getReviewByProductId = async ({
  productId,
}: {
  productId: string
}) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) {
      return null // Return null instead of throwing for unauthenticated users
    }
    const review = await Review.findOne({
      product: productId,
      user: session?.user?.id,
    })
    return review ? (JSON.parse(JSON.stringify(review)) as IReview) : null
  } catch {
    return null
  }
}

// Admin: Get all reviews with filters
export async function getAllReviews({
  page = 1,
  limit = 20,
  rating,
}: {
  page?: number
  limit?: number
  rating?: string
}) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      throw new Error('Unauthorized')
    }

    const skipAmount = (page - 1) * limit
    const filter: { rating?: number } = {}
    
    if (rating && rating !== 'all') {
      filter.rating = parseInt(rating)
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limit)
      .lean()

    const totalReviews = await Review.countDocuments(filter)

    return {
      success: true,
      data: JSON.parse(JSON.stringify(reviews)),
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      data: [],
      totalPages: 0,
      totalReviews: 0,
    }
  }
}

// Admin: Delete review
export async function deleteReview(reviewId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session?.user || session.user.role !== 'Admin') {
      throw new Error('Unauthorized')
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    const productId = review.product
    await Review.findByIdAndDelete(reviewId)
    
    // Update product review stats
    await updateProductReview(productId)

    revalidatePath('/admin/reviews')
    return {
      success: true,
      message: 'Review deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}
