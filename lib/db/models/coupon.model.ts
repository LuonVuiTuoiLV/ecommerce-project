import { Document, Model, model, models, Schema } from 'mongoose'

export interface ICouponUsage {
  user: string
  usedAt: Date
}

export interface ICoupon extends Document {
  _id: string
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  usagePerUser: number // Max times a single user can use this coupon
  usedBy: ICouponUsage[] // Track which users have used this coupon
  startDate: Date
  endDate: Date
  isActive: boolean
  applicableCategories?: string[]
  createdAt: Date
  updatedAt: Date
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    user: {
      type: String,
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    usedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    usagePerUser: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    usedBy: {
      type: [couponUsageSchema],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster lookups
couponSchema.index({ code: 1 })
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 })
couponSchema.index({ 'usedBy.user': 1 }) // For per-user usage tracking

const Coupon =
  (models.Coupon as Model<ICoupon>) || model<ICoupon>('Coupon', couponSchema)

export default Coupon
