import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'
import { IContact } from '@/lib/db/models/contact.model'
import { IOrder } from '@/lib/db/models/order.model'
import { Resend } from 'resend'
import AskReviewOrderItemsEmail from './ask-review-order-items'
import BackInStockEmail from './back-in-stock'
import ContactNotificationEmail from './contact-notification'
import PurchaseReceiptEmail from './purchase-receipt'

const resend = new Resend(process.env.RESEND_API_KEY as string)

// Email subject translations
const emailSubjects = {
  vi: {
    orderConfirmation: 'Xác nhận đơn hàng',
    reviewOrderItems: 'Đánh giá sản phẩm đã mua',
    newContactMessage: 'Tin nhắn liên hệ mới',
    backInStock: 'Sản phẩm đã có hàng trở lại',
  },
  'en-US': {
    orderConfirmation: 'Order Confirmation',
    reviewOrderItems: 'Review your order items',
    newContactMessage: 'New Contact Message',
    backInStock: 'Product Back in Stock',
  },
}

export const sendPurchaseReceipt = async ({ order, locale = 'vi' }: { order: IOrder; locale?: 'vi' | 'en-US' }) => {
  const subjects = emailSubjects[locale] || emailSubjects['vi']
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: subjects.orderConfirmation,
    react: <PurchaseReceiptEmail order={order} locale={locale} />,
  })
}

export const sendAskReviewOrderItems = async ({ order, locale = 'vi' }: { order: IOrder; locale?: 'vi' | 'en-US' }) => {
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  const subjects = emailSubjects[locale] || emailSubjects['vi']

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: subjects.reviewOrderItems,
    react: <AskReviewOrderItemsEmail order={order} locale={locale} />,
    scheduledAt: oneDayFromNow,
  })
}

// Send contact notification to admin
export const sendContactNotification = async ({
  contact,
  adminEmail,
  locale = 'vi',
}: {
  contact: IContact
  adminEmail: string
  locale?: 'vi' | 'en-US'
}) => {
  const subjects = emailSubjects[locale] || emailSubjects['vi']

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: adminEmail,
    subject: `${subjects.newContactMessage}: ${contact.subject}`,
    react: <ContactNotificationEmail contact={contact} locale={locale} />,
  })
}

// Send back in stock notification
export const sendBackInStockNotification = async ({
  email,
  productName,
  productSlug,
  productImage,
  siteUrl,
  siteName,
  locale = 'vi',
}: {
  email: string
  productName: string
  productSlug: string
  productImage?: string
  siteUrl: string
  siteName: string
  locale?: 'vi' | 'en-US'
}) => {
  const subjects = emailSubjects[locale] || emailSubjects['vi']

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: email,
    subject: `${subjects.backInStock}: ${productName}`,
    react: (
      <BackInStockEmail
        productName={productName}
        productSlug={productSlug}
        productImage={productImage}
        siteUrl={siteUrl}
        siteName={siteName}
        locale={locale}
      />
    ),
  })
}
