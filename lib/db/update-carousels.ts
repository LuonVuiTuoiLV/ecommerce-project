/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import Setting from './models/setting.model'

async function updateCarousels() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    const setting = await Setting.findOne({})
    
    if (!setting) {
      console.log('No settings found in database')
      return
    }

    console.log('Current carousels:', setting.carousels)

    // Update carousel titles and URLs with proper Vietnamese diacritics
    const updatedCarousels = setting.carousels.map((carousel: any) => {
      const carouselObj = carousel.toObject ? carousel.toObject() : carousel
      
      if (carouselObj.title === 'Giay the thao hot nhat') {
        return {
          ...carouselObj,
          title: 'Giày thể thao hot nhất',
          url: '/search?category=Giày dép'
        }
      }
      if (carouselObj.title === 'Ao thun ban chay') {
        return {
          ...carouselObj,
          title: 'Áo thun bán chạy',
          url: '/search?category=Áo thun'
        }
      }
      if (carouselObj.title === 'Dong ho giam gia soc') {
        return {
          ...carouselObj,
          title: 'Đồng hồ giảm giá sốc',
          buttonCaption: 'Xem thêm',
          url: '/search?category=Đồng hồ đeo tay'
        }
      }
      return carouselObj
    })

    await Setting.updateOne(
      { _id: setting._id },
      { $set: { carousels: updatedCarousels } }
    )

    console.log('\nCarousels updated successfully!')
    console.log('New carousels:')
    updatedCarousels.forEach((c: any, i: number) => {
      console.log(`${i + 1}. ${c.title} - ${c.buttonCaption} - ${c.url}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error updating carousels:', error)
    process.exit(1)
  }
}

updateCarousels()
