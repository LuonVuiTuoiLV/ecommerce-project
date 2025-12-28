/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import Product from './models/product.model'

// Mapping English to Vietnamese for categories
const categoryMapping: Record<string, string> = {
  'Jeans': 'Quần Jean',
  'Shoes': 'Giày dép',
  'T-Shirts': 'Áo thun',
  'Wrist Watches': 'Đồng hồ đeo tay',
  'Pants': 'Quần',
  'Shirts': 'Áo sơ mi',
  'Accessories': 'Phụ kiện',
  'Bags': 'Túi xách',
  'Hats': 'Mũ nón',
  'Jackets': 'Áo khoác',
  'Dresses': 'Váy đầm',
  'Skirts': 'Chân váy',
  'Sportswear': 'Đồ thể thao',
  'Underwear': 'Đồ lót',
  'Socks': 'Tất vớ',
}

// Mapping English to Vietnamese for tags
const tagMapping: Record<string, string> = {
  'Best Seller': 'Bán chạy',
  'best-seller': 'Bán chạy',
  'Featured': 'Nổi bật',
  'featured': 'Nổi bật',
  'New Arrival': 'Hàng mới',
  'new arrival': 'Hàng mới',
  'new-arrival': 'Hàng mới',
  'Todays Deal': 'Ưu đãi hôm nay',
  'todays-deal': 'Ưu đãi hôm nay',
  "Today's Deal": 'Ưu đãi hôm nay',
  'Hot': 'Hot',
  'Sale': 'Giảm giá',
  'Trending': 'Xu hướng',
  'Popular': 'Phổ biến',
  'Limited': 'Giới hạn',
  'Exclusive': 'Độc quyền',
}

// Mapping English to Vietnamese for colors
const colorMapping: Record<string, string> = {
  'White': 'Trắng',
  'Black': 'Đen',
  'Red': 'Đỏ',
  'Blue': 'Xanh dương',
  'Green': 'Xanh lá',
  'Yellow': 'Vàng',
  'Orange': 'Cam',
  'Pink': 'Hồng',
  'Purple': 'Tím',
  'Brown': 'Nâu',
  'Gray': 'Xám',
  'Grey': 'Xám',
  'Navy': 'Xanh navy',
  'Beige': 'Be',
  'Gold': 'Vàng gold',
  'Silver': 'Bạc',
}

// Mapping English to Vietnamese for sizes (kept for reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sizeMapping: Record<string, string> = {
  'XS': 'XS',
  'S': 'S',
  'M': 'M',
  'L': 'L',
  'XL': 'XL',
  'XXL': 'XXL',
  'XXXL': 'XXXL',
  'One Size': 'Freesize',
  'Free Size': 'Freesize',
}

async function updateProductsToVietnamese() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    const products = await Product.find({})
    console.log(`Found ${products.length} products to update`)

    let updatedCount = 0

    for (const product of products) {
      const updates: any = {}

      // Update category
      if (product.category && categoryMapping[product.category]) {
        updates.category = categoryMapping[product.category]
      }

      // Update tags
      if (product.tags && product.tags.length > 0) {
        const newTags = product.tags.map((tag: string) => {
          return tagMapping[tag] || tagMapping[tag.toLowerCase()] || tag
        })
        if (JSON.stringify(newTags) !== JSON.stringify(product.tags)) {
          updates.tags = newTags
        }
      }

      // Update colors
      if (product.colors && product.colors.length > 0) {
        const newColors = product.colors.map((color: string) => {
          return colorMapping[color] || color
        })
        if (JSON.stringify(newColors) !== JSON.stringify(product.colors)) {
          updates.colors = newColors
        }
      }

      // Update sizes (keep original as sizes are usually standard)
      // Uncomment if you want to translate sizes
      // if (product.sizes && product.sizes.length > 0) {
      //   const newSizes = product.sizes.map((size: string) => {
      //     return sizeMapping[size] || size
      //   })
      //   if (JSON.stringify(newSizes) !== JSON.stringify(product.sizes)) {
      //     updates.sizes = newSizes
      //   }
      // }

      if (Object.keys(updates).length > 0) {
        await Product.updateOne({ _id: product._id }, { $set: updates })
        console.log(`Updated product: ${product.name}`)
        console.log(`  - Category: ${product.category} -> ${updates.category || product.category}`)
        if (updates.tags) {
          console.log(`  - Tags: ${product.tags.join(', ')} -> ${updates.tags.join(', ')}`)
        }
        if (updates.colors) {
          console.log(`  - Colors: ${product.colors.join(', ')} -> ${updates.colors.join(', ')}`)
        }
        updatedCount++
      }
    }

    console.log(`\nUpdate complete! ${updatedCount} products updated.`)
    process.exit(0)
  } catch (error) {
    console.error('Error updating products:', error)
    process.exit(1)
  }
}

updateProductsToVietnamese()
