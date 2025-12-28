import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { sendPurchaseReceipt } from '@/emails'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  try {
    // Validate webhook secret exists
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return new NextResponse('Server configuration error', { status: 500 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new NextResponse('Missing stripe-signature header', { status: 400 })
    }

    const event = await stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    if (event.type === 'charge.succeeded') {
      // Connect to database
      await connectToDatabase()
      
      const charge = event.data.object
      const orderId = charge.metadata.orderId
      
      if (!orderId) {
        console.error('Missing orderId in charge metadata')
        return new NextResponse('Missing orderId', { status: 400 })
      }
      
      const email = charge.billing_details.email
      const pricePaidInCents = charge.amount
      const order = await Order.findById(orderId).populate('user', 'email')
      
      if (order == null) {
        console.error(`Order not found: ${orderId}`)
        return new NextResponse('Order not found', { status: 404 })
      }

      // Prevent duplicate processing
      if (order.isPaid) {
        return NextResponse.json({ message: 'Order already paid' })
      }

      order.isPaid = true
      order.paidAt = new Date()
      order.paymentResult = {
        id: event.id,
        status: 'COMPLETED',
        email_address: email!,
        pricePaid: (pricePaidInCents / 100).toFixed(2),
      }
      await order.save()
      
      try {
        await sendPurchaseReceipt({ order })
      } catch (err) {
        console.error('Failed to send purchase receipt email:', err)
      }
      
      return NextResponse.json({
        message: 'Order payment processed successfully',
      })
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return new NextResponse('Invalid signature', { status: 400 })
    }
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
