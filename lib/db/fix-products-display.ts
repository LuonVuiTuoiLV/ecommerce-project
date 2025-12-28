/**
 * Script to fix products display on homepage
 * - Ensures products are published
 * - Adds Vietnamese tags for homepage sections
 * Run with: npx tsx lib/db/fix-products-display.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnv()

import { connectToDatabase } from '.'
import Product from './models/product.model'

// Vietnamese tags used on homepage
const HOMEPAGE_TAGS = {
  newArrivals: 'Hàng mới',
  featured: 'Nổi bật', 
  bestSeller: 'Bán chạy',
  todaysDeal: 'Ưu đãi hôm nay',
}

async function fixProductsDisplay() {
  try {
    await connectToDatabase()
    
    // 1. Check current product status
    const allProducts = await Product.find({})
    console.log(`\n=== Product Status ===`)
    console.log(`Total products: ${allProducts.length}`)
    
    const publishedProducts = allProducts.filter(p => p.isPublished)
    const unpublishedProducts = allProducts.filter(p => !p.isPublished)
    console.log(`Published: ${publishedProducts.length}`)
    console.log(`Unpublished: ${unpublishedProducts.length}`)
    
    // 2. Check tags distribution
    console.log(`\n=== Tags Distribution ===`)
    const tagCounts: Record<string, number> = {}
    allProducts.forEach(p => {
      p.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    Object.entries(tagCounts).forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} products`)
    })
    
    // 3. Check homepage tags
    console.log(`\n=== Homepage Tags (Published Only) ===`)
    for (const [key, tag] of Object.entries(HOMEPAGE_TAGS)) {
      const count = await Product.countDocuments({ 
        tags: { $in: [tag] }, 
        isPublished: true 
      })
      console.log(`  ${key} (${tag}): ${count} products`)
    }
    
    // 4. Publish all unpublished products
    if (unpublishedProducts.length > 0) {
      console.log(`\n=== Publishing ${unpublishedProducts.length} products ===`)
      await Product.updateMany(
        { isPublished: false },
        { $set: { isPublished: true } }
      )
      console.log('✅ All products published!')
    }
    
    // 5. Add Vietnamese tags to products that don't have them
    console.log(`\n=== Adding Vietnamese Tags ===`)
    
    // Add 'Ưu đãi hôm nay' to products with 'todays-deal' tag
    const todaysDealResult = await Product.updateMany(
      { tags: { $in: ['todays-deal'] } },
      { $addToSet: { tags: HOMEPAGE_TAGS.todaysDeal } }
    )
    console.log(`Added "${HOMEPAGE_TAGS.todaysDeal}" to ${todaysDealResult.modifiedCount} products`)
    
    // Get products without any homepage tags
    const productsWithoutTags = await Product.find({
      $and: [
        { tags: { $nin: [HOMEPAGE_TAGS.newArrivals] } },
        { tags: { $nin: [HOMEPAGE_TAGS.featured] } },
        { tags: { $nin: [HOMEPAGE_TAGS.bestSeller] } },
      ]
    })
    
    console.log(`Products without homepage tags: ${productsWithoutTags.length}`)
    
    if (productsWithoutTags.length > 0) {
      // Distribute products across tags
      const chunkSize = Math.ceil(productsWithoutTags.length / 3)
      
      for (let i = 0; i < productsWithoutTags.length; i++) {
        const product = productsWithoutTags[i]
        let tagToAdd: string
        
        if (i < chunkSize) {
          tagToAdd = HOMEPAGE_TAGS.newArrivals
        } else if (i < chunkSize * 2) {
          tagToAdd = HOMEPAGE_TAGS.featured
        } else {
          tagToAdd = HOMEPAGE_TAGS.bestSeller
        }
        
        await Product.updateOne(
          { _id: product._id },
          { $addToSet: { tags: tagToAdd } }
        )
        console.log(`  Added "${tagToAdd}" to: ${product.name}`)
      }
    }
    
    // 6. Final check
    console.log(`\n=== Final Homepage Tags Count ===`)
    for (const [key, tag] of Object.entries(HOMEPAGE_TAGS)) {
      const count = await Product.countDocuments({ 
        tags: { $in: [tag] }, 
        isPublished: true 
      })
      console.log(`  ${key} (${tag}): ${count} products`)
    }
    
    console.log('\n✅ Products display fixed!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixProductsDisplay()
