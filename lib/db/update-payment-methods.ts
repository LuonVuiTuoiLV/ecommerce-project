/**
 * Script to update payment methods with bank transfer details
 * Run with: npx tsx lib/db/update-payment-methods.ts
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

// Import after env is loaded
import { connectToDatabase } from '.'
import Setting from './models/setting.model'

async function updatePaymentMethods() {
  try {
    await connectToDatabase()

    const setting = await Setting.findOne()
    if (!setting) {
      console.error('No settings found')
      process.exit(1)
    }

    // Clean up invalid payment methods (missing name)
    setting.availablePaymentMethods = setting.availablePaymentMethods.filter(
      (pm: { name?: string }) => pm.name && pm.name.trim() !== ''
    )

    // Update Bank Transfer payment method with bank details
    const bankTransferIndex = setting.availablePaymentMethods.findIndex(
      (pm: { name: string }) => pm.name === 'Bank Transfer'
    )

    if (bankTransferIndex !== -1) {
      // Update existing Bank Transfer
      setting.availablePaymentMethods[bankTransferIndex] = {
        name: 'Bank Transfer',
        commission: setting.availablePaymentMethods[bankTransferIndex].commission || 0,
        bankName: process.env.BANK_NAME || 'Vietcombank',
        bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
        bankAccountName: process.env.BANK_ACCOUNT_NAME || 'CONG TY TNHH SHOPVN',
        description: 'Vui lòng chuyển khoản đúng số tiền và nội dung. Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.',
      }
    } else {
      // Add Bank Transfer if not exists
      setting.availablePaymentMethods.push({
        name: 'Bank Transfer',
        commission: 0,
        bankName: process.env.BANK_NAME || 'Vietcombank',
        bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
        bankAccountName: process.env.BANK_ACCOUNT_NAME || 'CONG TY TNHH SHOPVN',
        description: 'Vui lòng chuyển khoản đúng số tiền và nội dung. Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.',
      })
    }

    await setting.save()
    console.log('Payment methods updated successfully!')
    console.log('Current payment methods:', setting.availablePaymentMethods.map((pm: { name: string }) => pm.name))
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updatePaymentMethods()
