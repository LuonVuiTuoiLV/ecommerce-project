/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import Setting from './models/setting.model'

async function updateSettingsVietnamese() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    const setting = await Setting.findOne({})
    
    if (!setting) {
      console.log('No settings found in database')
      return
    }

    // Update site info with proper Vietnamese diacritics
    const updatedSite = {
      ...setting.site,
      description: 'ShopVN - Mua sắm trực tuyến giá tốt, giao hàng nhanh toàn quốc.',
      keywords: 'mua sắm online, thời trang, điện tử, gia dụng, Việt Nam',
      slogan: 'Mua sắm thông minh, giá cả hợp lý.',
      copyright: '2024, ShopVN. Bảo lưu mọi quyền.',
      address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    }

    // Update delivery dates with proper Vietnamese diacritics
    const updatedDeliveryDates = setting.availableDeliveryDates.map((date: any) => {
      const dateObj = date.toObject ? date.toObject() : date
      
      if (dateObj.name === 'Giao nhanh (1 ngay)') {
        return { ...dateObj, name: 'Giao nhanh (1 ngày)' }
      }
      if (dateObj.name === 'Giao tieu chuan (3 ngay)') {
        return { ...dateObj, name: 'Giao tiêu chuẩn (3 ngày)' }
      }
      if (dateObj.name === 'Giao tiet kiem (5 ngay)') {
        return { ...dateObj, name: 'Giao tiết kiệm (5 ngày)' }
      }
      return dateObj
    })

    // Update default delivery date
    let updatedDefaultDeliveryDate = setting.defaultDeliveryDate
    if (updatedDefaultDeliveryDate === 'Giao tiet kiem (5 ngay)') {
      updatedDefaultDeliveryDate = 'Giao tiết kiệm (5 ngày)'
    }

    await Setting.updateOne(
      { _id: setting._id },
      {
        $set: {
          site: updatedSite,
          availableDeliveryDates: updatedDeliveryDates,
          defaultDeliveryDate: updatedDefaultDeliveryDate,
        }
      }
    )

    console.log('\nSettings updated successfully!')
    console.log('\nSite info:')
    console.log('- Description:', updatedSite.description)
    console.log('- Slogan:', updatedSite.slogan)
    console.log('- Address:', updatedSite.address)
    console.log('\nDelivery dates:')
    updatedDeliveryDates.forEach((d: any, i: number) => {
      console.log(`${i + 1}. ${d.name}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error updating settings:', error)
    process.exit(1)
  }
}

updateSettingsVietnamese()
