import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

// Escape special regex characters to prevent ReDoS attacks
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20) // Max 20

    // Validate input length
    if (q.length < 2 || q.length > 100) {
      return NextResponse.json({ products: [] })
    }

    await connectToDatabase()

    // Sanitize search query to prevent ReDoS
    const sanitizedQuery = escapeRegex(q.trim())

    const query: Record<string, unknown> = {
      isPublished: true,
      $or: [
        { name: { $regex: sanitizedQuery, $options: 'i' } },
        { brand: { $regex: sanitizedQuery, $options: 'i' } },
        { category: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    }

    if (category && category !== 'all') {
      query.category = escapeRegex(category)
    }

    const products = await Product.find(query)
      .select('_id name slug images price category')
      .limit(limit)
      .lean()

    return NextResponse.json({
      products: products.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        images: p.images,
        price: p.price,
        category: p.category,
      })),
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
