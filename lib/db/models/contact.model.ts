import { Document, Model, model, models, Schema } from 'mongoose'

export interface IContact extends Document {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'closed'
  createdAt: Date
  updatedAt: Date
}

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster lookups
contactSchema.index({ status: 1, createdAt: -1 })
contactSchema.index({ email: 1 })
contactSchema.index({ createdAt: -1 })

const Contact =
  (models.Contact as Model<IContact>) ||
  model<IContact>('Contact', contactSchema)

export default Contact
