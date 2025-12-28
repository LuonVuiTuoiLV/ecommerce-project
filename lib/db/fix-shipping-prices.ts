/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import Setting from './models/setting.model'

/**
 * Script để fix phí vận chuyển
 * 
 * Vấn đề: Tất cả giá trong hệ thống được lưu bằng USD (base currency)
 * và được convert sang VND khi hiển thị (nhân với convertRate = 24500)
 * 
 * Phí vận chuyển cần được lưu bằng USD để hiển thị đúng:
 * - Giao nhanh: 50,000 VND ≈ 2.04 USD
 * - Giao tiêu chuẩn: 30,000 VND ≈ 1.22 USD  
 * - Giao tiết kiệm: 15,000 VND ≈ 0.61 USD
 * - Free shipping min: 500,000 VND ≈ 20.41 USD
 */
async function fixShippingPrices() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    const setting = await Setting.findOne({})
    
    if (!setting) {
      console.log('No settings found in database')
      return
    }

    console.log('\n=== Current Delivery Dates ===')
    setting.availableDeliveryDates.forEach((d: any, i: number) => {
      console.log(`${i + 1}. ${d.name}`)
      console.log(`   - Shipping Price: ${d.shippingPrice}`)
      console.log(`   - Free Shipping Min: ${d.freeShippingMinPrice}`)
    })

    // Convert VND to USD (if prices are in VND format - > 1000)
    const convertRate = 24500
    const updatedDeliveryDates = setting.availableDeliveryDates.map((date: any) => {
      const dateObj = date.toObject ? date.toObject() : date
      
      // Check if price is in VND format (> 1000)
      const shippingPrice = dateObj.shippingPrice > 1000 
        ? Math.round((dateObj.shippingPrice / convertRate) * 100) / 100
        : dateObj.shippingPrice
      
      const freeShippingMinPrice = dateObj.freeShippingMinPrice > 1000
        ? Math.round((dateObj.freeShippingMinPrice / convertRate) * 100) / 100
        : dateObj.freeShippingMinPrice

      return {
        ...dateObj,
        shippingPrice,
        freeShippingMinPrice,
      }
    })

    // Also fix common.freeShippingMinPrice if needed
    let commonFreeShippingMinPrice = setting.common.freeShippingMinPrice
    if (commonFreeShippingMinPrice > 1000) {
      commonFreeShippingMinPrice = Math.round((commonFreeShippingMinPrice / convertRate) * 100) / 100
    }

    await Setting.updateOne(
      { _id: setting._id },
      {
        $set: {
          availableDeliveryDates: updatedDeliveryDates,
          'common.freeShippingMinPrice': commonFreeShippingMinPrice,
        }
      }
    )

    console.log('\n=== Updated Delivery Dates ===')
    updatedDeliveryDates.forEach((d: any, i: number) => {
      console.log(`${i + 1}. ${d.name}`)
      console.log(`   - Shipping Price: ${d.shippingPrice} USD (~${Math.round(d.shippingPrice * convertRate).toLocaleString()} VND)`)
      console.log(`   - Free Shipping Min: ${d.freeShippingMinPrice} USD (~${Math.round(d.freeShippingMinPrice * convertRate).toLocaleString()} VND)`)
    })

    console.log('\n✅ Shipping prices fixed successfully!')
    console.log('\nNote: All prices are now stored in USD and will be converted to VND when displayed.')
    
    process.exit(0)
  } catch (error) {
    console.error('Error fixing shipping prices:', error)
    process.exit(1)
  }
}

fixShippingPrices()
