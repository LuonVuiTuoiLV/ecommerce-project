import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { getEffectiveStock } from '@/lib/inventory-reservation'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json()
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      )
    }

    // Limit to 50 products per request
    if (productIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 products per request' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const products = await Product.find(
      { _id: { $in: productIds } },
      { _id: 1, countInStock: 1, name: 1 }
    ).lean()

    const stockInfo = products.map((product) => ({
      productId: product._id.toString(),
      name: product.name,
      actualStock: product.countInStock,
      effectiveStock: getEffectiveStock(product._id.toString(), product.countInStock),
      inStock: getEffectiveStock(product._id.toString(), product.countInStock) > 0,
    }))

    return NextResponse.json({ data: stockInfo })
  } catch (error) {
    console.error('Stock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock' },
      { status: 500 }
    )
  }
}
