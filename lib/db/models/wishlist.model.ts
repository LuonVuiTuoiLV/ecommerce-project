import { Document, Model, model, models, Schema } from 'mongoose'

export interface IWishlistItem {
  product: string
  addedAt: Date
}

export interface IWishlist extends Document {
  _id: string
  user: string
  items: IWishlistItem[]
  createdAt: Date
  updatedAt: Date
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Database indexes for query optimization
wishlistSchema.index({ user: 1 })
wishlistSchema.index({ 'items.product': 1 })

const Wishlist =
  (models.Wishlist as Model<IWishlist>) ||
  model<IWishlist>('Wishlist', wishlistSchema)

export default Wishlist
