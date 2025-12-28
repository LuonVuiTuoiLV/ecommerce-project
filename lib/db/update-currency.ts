import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { connectToDatabase } from './index'
import Setting from './models/setting.model'

async function updateCurrencySettings() {
  try {
    await connectToDatabase()
    
    // USD là base currency (convertRate = 1)
    // VND convertRate = 24500 (1 USD = 24500 VND)
    const result = await Setting.findOneAndUpdate(
      {},
      {
        $set: {
          availableCurrencies: [
            {
              name: 'Viet Nam Dong',
              code: 'VND',
              symbol: '₫',
              convertRate: 24500, // 1 USD = 24500 VND
            },
            {
              name: 'United States Dollar',
              code: 'USD',
              symbol: '$',
              convertRate: 1, // Base currency
            },
          ],
          defaultCurrency: 'VND',
        },
      },
      { new: true }
    )

    if (result) {
      console.log('✅ Currency settings updated successfully!')
      console.log('Default currency:', result.defaultCurrency)
      console.log('Available currencies:', result.availableCurrencies)
    } else {
      console.log('❌ No setting found to update')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating currency settings:', error)
    process.exit(1)
  }
}

updateCurrencySettings()
