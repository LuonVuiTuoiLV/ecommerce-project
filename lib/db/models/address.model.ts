import { Document, Model, model, models, Schema } from 'mongoose'

export interface IAddress extends Document {
  _id: string
  user: string
  fullName: string
  phone: string
  // Vietnam address fields (API v2 - 2 cấp sau sáp nhập 07/2025)
  provinceCode?: number
  provinceName: string
  wardCode?: number
  wardName: string
  street: string
  // Legacy fields (backward compatibility)
  city?: string
  province?: string
  districtCode?: number
  districtName?: string
  postalCode?: string
  country: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: 'User',
      required: true,
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    // Vietnam address fields (API v2 - 2 cấp)
    provinceCode: { type: Number },
    provinceName: { type: String, required: true },
    wardCode: { type: Number },
    wardName: { type: String, required: true },
    street: { type: String, required: true },
    // Legacy fields
    city: { type: String },
    province: { type: String },
    districtCode: { type: Number },
    districtName: { type: String },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'Việt Nam' },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
addressSchema.index({ user: 1 })
addressSchema.index({ user: 1, isDefault: -1 })

const Address =
  (models.Address as Model<IAddress>) ||
  model<IAddress>('Address', addressSchema)

export default Address
