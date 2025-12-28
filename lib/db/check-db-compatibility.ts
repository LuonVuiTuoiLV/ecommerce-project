/**
 * Script to check and fix database compatibility with new schema updates
 * Run with: npx tsx lib/db/check-db-compatibility.ts
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
import Address from './models/address.model'
import Contact from './models/contact.model'
import Coupon from './models/coupon.model'
import Order from './models/order.model'
import Product from './models/product.model'
import Review from './models/review.model'
import Setting from './models/setting.model'
import StockNotification from './models/stock-notification.model'
import User from './models/user.model'
import WebPage from './models/web-page.model'
import Wishlist from './models/wishlist.model'

interface CheckResult {
  collection: string
  total: number
  issues: string[]
  fixed: number
}

async function checkDatabaseCompatibility() {
  console.log('\n🔍 KIỂM TRA TƯƠNG THÍCH DATABASE\n')
  console.log('='.repeat(60))
  
  await connectToDatabase()
  
  const results: CheckResult[] = []

  // 1. Check Products
  console.log('\n📦 1. PRODUCTS')
  const products = await Product.find({})
  const productIssues: string[] = []
  let productFixed = 0

  for (const product of products) {
    // Check isPublished field
    if (product.isPublished === undefined) {
      productIssues.push(`Product ${product.name}: missing isPublished`)
      await Product.updateOne({ _id: product._id }, { $set: { isPublished: true } })
      productFixed++
    }
    // Check tags array
    if (!product.tags || !Array.isArray(product.tags)) {
      productIssues.push(`Product ${product.name}: missing/invalid tags`)
      await Product.updateOne({ _id: product._id }, { $set: { tags: [] } })
      productFixed++
    }
    // Check numSales
    if (product.numSales === undefined) {
      productIssues.push(`Product ${product.name}: missing numSales`)
      await Product.updateOne({ _id: product._id }, { $set: { numSales: 0 } })
      productFixed++
    }
  }
  
  console.log(`  Total: ${products.length}`)
  console.log(`  Issues: ${productIssues.length}`)
  console.log(`  Fixed: ${productFixed}`)
  results.push({ collection: 'Products', total: products.length, issues: productIssues, fixed: productFixed })

  // 2. Check Orders
  console.log('\n🛒 2. ORDERS')
  const orders = await Order.find({})
  const orderIssues: string[] = []
  let orderFixed = 0

  for (const order of orders) {
    // Check couponCode and discountAmount fields (new fields)
    if (order.discountAmount === undefined) {
      orderIssues.push(`Order ${order._id}: missing discountAmount`)
      await Order.updateOne({ _id: order._id }, { $set: { discountAmount: 0 } })
      orderFixed++
    }
    // Check shippingAddress.phone
    if (!order.shippingAddress?.phone) {
      orderIssues.push(`Order ${order._id}: missing shippingAddress.phone`)
    }
  }

  console.log(`  Total: ${orders.length}`)
  console.log(`  Issues: ${orderIssues.length}`)
  console.log(`  Fixed: ${orderFixed}`)
  results.push({ collection: 'Orders', total: orders.length, issues: orderIssues, fixed: orderFixed })

  // 3. Check Users
  console.log('\n👤 3. USERS')
  const users = await User.find({})
  const userIssues: string[] = []
  let userFixed = 0

  for (const user of users) {
    // Check role field
    if (!user.role) {
      userIssues.push(`User ${user.email}: missing role`)
      await User.updateOne({ _id: user._id }, { $set: { role: 'User' } })
      userFixed++
    }
    // Check emailVerified
    if (user.emailVerified === undefined) {
      userIssues.push(`User ${user.email}: missing emailVerified`)
      await User.updateOne({ _id: user._id }, { $set: { emailVerified: false } })
      userFixed++
    }
  }

  console.log(`  Total: ${users.length}`)
  console.log(`  Issues: ${userIssues.length}`)
  console.log(`  Fixed: ${userFixed}`)
  results.push({ collection: 'Users', total: users.length, issues: userIssues, fixed: userFixed })

  // 4. Check Coupons
  console.log('\n🎟️ 4. COUPONS')
  const coupons = await Coupon.find({})
  const couponIssues: string[] = []
  let couponFixed = 0

  for (const coupon of coupons) {
    // Check usagePerUser field (new field)
    if (coupon.usagePerUser === undefined) {
      couponIssues.push(`Coupon ${coupon.code}: missing usagePerUser`)
      await Coupon.updateOne({ _id: coupon._id }, { $set: { usagePerUser: 1 } })
      couponFixed++
    }
    // Check usedBy array (new field)
    if (!coupon.usedBy || !Array.isArray(coupon.usedBy)) {
      couponIssues.push(`Coupon ${coupon.code}: missing usedBy array`)
      await Coupon.updateOne({ _id: coupon._id }, { $set: { usedBy: [] } })
      couponFixed++
    }
  }

  console.log(`  Total: ${coupons.length}`)
  console.log(`  Issues: ${couponIssues.length}`)
  console.log(`  Fixed: ${couponFixed}`)
  results.push({ collection: 'Coupons', total: coupons.length, issues: couponIssues, fixed: couponFixed })

  // 5. Check Settings
  console.log('\n⚙️ 5. SETTINGS')
  const settings = await Setting.find({})
  const settingIssues: string[] = []
  let settingFixed = 0

  for (const setting of settings) {
    // Check payment methods have bank fields
    let needsUpdate = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedPaymentMethods = setting.availablePaymentMethods.map((pm: any) => {
      if (pm.name === 'Bank Transfer' && !pm.bankName) {
        settingIssues.push('Bank Transfer missing bank details')
        needsUpdate = true
        return {
          ...pm,
          bankName: pm.bankName || '',
          bankAccountNumber: pm.bankAccountNumber || '',
          bankAccountName: pm.bankAccountName || '',
          description: pm.description || '',
        }
      }
      return pm
    })
    
    if (needsUpdate) {
      await Setting.updateOne(
        { _id: setting._id },
        { $set: { availablePaymentMethods: updatedPaymentMethods } }
      )
      settingFixed++
    }
  }

  console.log(`  Total: ${settings.length}`)
  console.log(`  Issues: ${settingIssues.length}`)
  console.log(`  Fixed: ${settingFixed}`)
  results.push({ collection: 'Settings', total: settings.length, issues: settingIssues, fixed: settingFixed })

  // 6. Check Addresses
  console.log('\n📍 6. ADDRESSES')
  const addresses = await Address.find({})
  const addressIssues: string[] = []
  let addressFixed = 0

  for (const address of addresses) {
    // Check new Vietnam address fields
    if (!address.provinceName && address.province) {
      addressIssues.push(`Address ${address._id}: migrating province to provinceName`)
      await Address.updateOne(
        { _id: address._id },
        { $set: { provinceName: address.province } }
      )
      addressFixed++
    }
    if (!address.wardName && address.city) {
      addressIssues.push(`Address ${address._id}: migrating city to wardName`)
      await Address.updateOne(
        { _id: address._id },
        { $set: { wardName: address.city } }
      )
      addressFixed++
    }
  }

  console.log(`  Total: ${addresses.length}`)
  console.log(`  Issues: ${addressIssues.length}`)
  console.log(`  Fixed: ${addressFixed}`)
  results.push({ collection: 'Addresses', total: addresses.length, issues: addressIssues, fixed: addressFixed })

  // 7. Check Contacts
  console.log('\n📧 7. CONTACTS')
  const contacts = await Contact.find({})
  const contactIssues: string[] = []

  for (const contact of contacts) {
    if (!['new', 'read', 'replied', 'closed'].includes(contact.status)) {
      contactIssues.push(`Contact ${contact._id}: invalid status "${contact.status}"`)
    }
  }

  console.log(`  Total: ${contacts.length}`)
  console.log(`  Issues: ${contactIssues.length}`)
  results.push({ collection: 'Contacts', total: contacts.length, issues: contactIssues, fixed: 0 })

  // 8. Check Reviews
  console.log('\n⭐ 8. REVIEWS')
  const reviews = await Review.find({})
  const reviewIssues: string[] = []
  let reviewFixed = 0

  for (const review of reviews) {
    if (review.isVerifiedPurchase === undefined) {
      reviewIssues.push(`Review ${review._id}: missing isVerifiedPurchase`)
      await Review.updateOne({ _id: review._id }, { $set: { isVerifiedPurchase: false } })
      reviewFixed++
    }
  }

  console.log(`  Total: ${reviews.length}`)
  console.log(`  Issues: ${reviewIssues.length}`)
  console.log(`  Fixed: ${reviewFixed}`)
  results.push({ collection: 'Reviews', total: reviews.length, issues: reviewIssues, fixed: reviewFixed })

  // 9. Check Wishlists
  console.log('\n❤️ 9. WISHLISTS')
  const wishlists = await Wishlist.find({})
  console.log(`  Total: ${wishlists.length}`)
  results.push({ collection: 'Wishlists', total: wishlists.length, issues: [], fixed: 0 })

  // 10. Check Stock Notifications
  console.log('\n🔔 10. STOCK NOTIFICATIONS')
  const stockNotifications = await StockNotification.find({})
  console.log(`  Total: ${stockNotifications.length}`)
  results.push({ collection: 'StockNotifications', total: stockNotifications.length, issues: [], fixed: 0 })

  // 11. Check Web Pages
  console.log('\n📄 11. WEB PAGES')
  const webPages = await WebPage.find({})
  const webPageIssues: string[] = []
  let webPageFixed = 0

  for (const page of webPages) {
    if (page.isPublished === undefined) {
      webPageIssues.push(`WebPage ${page.slug}: missing isPublished`)
      await WebPage.updateOne({ _id: page._id }, { $set: { isPublished: true } })
      webPageFixed++
    }
  }

  console.log(`  Total: ${webPages.length}`)
  console.log(`  Issues: ${webPageIssues.length}`)
  console.log(`  Fixed: ${webPageFixed}`)
  results.push({ collection: 'WebPages', total: webPages.length, issues: webPageIssues, fixed: webPageFixed })

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TÓM TẮT')
  console.log('='.repeat(60))
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const totalFixed = results.reduce((sum, r) => sum + r.fixed, 0)
  
  console.log(`\nTổng số collections: ${results.length}`)
  console.log(`Tổng số issues phát hiện: ${totalIssues}`)
  console.log(`Tổng số issues đã fix: ${totalFixed}`)
  
  if (totalIssues === 0) {
    console.log('\n✅ Database đã tương thích hoàn toàn với schema mới!')
  } else if (totalFixed === totalIssues) {
    console.log('\n✅ Tất cả issues đã được fix tự động!')
  } else {
    console.log('\n⚠️ Một số issues cần xử lý thủ công:')
    results.forEach(r => {
      if (r.issues.length > r.fixed) {
        console.log(`  - ${r.collection}: ${r.issues.length - r.fixed} issues còn lại`)
      }
    })
  }

  console.log('\n')
  process.exit(0)
}

checkDatabaseCompatibility().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
