'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { items } = await request.json()
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request' },
        { status: 400 }
      )
    }

    // Bulk fetch all products at once (avoid N+1 query)
    const productIds = items.map((item: { product: string }) => item.product)
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name countInStock isPublished')
      .lean()
    
    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]))

    const validItems: string[] = []
    const invalidItems: { productId: string; name: string; reason: string }[] = []

    for (const item of items) {
      const product = productMap.get(item.product)

      if (!product) {
        invalidItems.push({
          productId: item.product,
          name: item.name,
          reason: 'not_found',
        })
        continue
      }

      if (!product.isPublished) {
        invalidItems.push({
          productId: item.product,
          name: item.name,
          reason: 'not_published',
        })
        continue
      }

      if (product.countInStock < item.quantity) {
        invalidItems.push({
          productId: item.product,
          name: item.name,
          reason: 'insufficient_stock',
        })
        continue
      }

      validItems.push(item.product)
    }

    return NextResponse.json({
      success: true,
      data: {
        validItems,
        invalidItems,
        hasInvalidItems: invalidItems.length > 0,
      },
    })
  } catch (error) {
    console.error('Cart validation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
