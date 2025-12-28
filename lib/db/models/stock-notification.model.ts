import { Document, Model, model, models, Schema } from 'mongoose'

export interface IStockNotification extends Document {
  _id: string
  email: string
  product: string
  productName: string
  productSlug: string
  isNotified: boolean
  createdAt: Date
  notifiedAt?: Date
}

const stockNotificationSchema = new Schema<IStockNotification>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    product: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSlug: {
      type: String,
      required: true,
    },
    isNotified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index to prevent duplicate subscriptions
stockNotificationSchema.index({ email: 1, product: 1 }, { unique: true })
stockNotificationSchema.index({ product: 1, isNotified: 1 })

const StockNotification =
  (models.StockNotification as Model<IStockNotification>) ||
  model<IStockNotification>('StockNotification', stockNotificationSchema)

export default StockNotification
