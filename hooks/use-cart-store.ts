import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { Cart, OrderItem, ShippingAddress } from '@/types'

export interface CouponData {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
  description: string
}

const initialState: Cart & { coupon?: CouponData; discountAmount?: number } = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
  coupon: undefined,
  discountAmount: undefined,
}

interface CartState {
  cart: Cart & { coupon?: CouponData; discountAmount?: number }
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  applyCoupon: (coupon: CouponData) => void
  removeCoupon: () => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress, coupon } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        const priceData = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })

        // Recalculate discount if coupon is applied
        let discountAmount = 0
        if (coupon) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (priceData.itemsPrice * coupon.discountValue) / 100
            if (coupon.discountAmount && discountAmount > coupon.discountAmount) {
              discountAmount = coupon.discountAmount
            }
          } else {
            discountAmount = coupon.discountValue
          }
        }

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...priceData,
            discountAmount,
            totalPrice: priceData.totalPrice - discountAmount,
          },
        })
        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) {
          throw new Error('Item not found in cart')
        }
        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress, coupon } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return
        const updatedCartItems = items.map((x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
            ? { ...exist, quantity: quantity }
            : x
        )

        const priceData = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })

        // Recalculate discount if coupon is applied
        let discountAmount = 0
        if (coupon) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (priceData.itemsPrice * coupon.discountValue) / 100
            if (coupon.discountAmount && discountAmount > coupon.discountAmount) {
              discountAmount = coupon.discountAmount
            }
          } else {
            discountAmount = coupon.discountValue
          }
        }

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...priceData,
            discountAmount,
            totalPrice: priceData.totalPrice - discountAmount,
          },
        })
      },
      removeItem: async (item: OrderItem) => {
        const { items, shippingAddress, coupon } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )

        const priceData = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })

        // Recalculate discount if coupon is applied
        let discountAmount = 0
        if (coupon && updatedCartItems.length > 0) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (priceData.itemsPrice * coupon.discountValue) / 100
            if (coupon.discountAmount && discountAmount > coupon.discountAmount) {
              discountAmount = coupon.discountAmount
            }
          } else {
            discountAmount = coupon.discountValue
          }
        }

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...priceData,
            discountAmount: updatedCartItems.length > 0 ? discountAmount : 0,
            totalPrice: priceData.totalPrice - discountAmount,
            coupon: updatedCartItems.length > 0 ? coupon : undefined,
          },
        })
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const { items, coupon, discountAmount } = get().cart
        const priceData = await calcDeliveryDateAndPrice({
          items,
          shippingAddress,
        })
        set({
          cart: {
            ...get().cart,
            shippingAddress,
            ...priceData,
            totalPrice: priceData.totalPrice - (discountAmount || 0),
            coupon,
            discountAmount,
          },
        })
      },
      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        const { items, shippingAddress, coupon, discountAmount } = get().cart
        const priceData = await calcDeliveryDateAndPrice({
          items,
          shippingAddress,
          deliveryDateIndex: index,
        })
        set({
          cart: {
            ...get().cart,
            ...priceData,
            totalPrice: priceData.totalPrice - (discountAmount || 0),
            coupon,
            discountAmount,
          },
        })
      },
      applyCoupon: (coupon: CouponData) => {
        const cart = get().cart
        // Calculate new total: remove old discount, add new discount
        const baseTotal = cart.totalPrice + (cart.discountAmount || 0)
        const newTotalPrice = Math.max(0, baseTotal - coupon.discountAmount)
        set({
          cart: {
            ...cart,
            coupon,
            discountAmount: coupon.discountAmount,
            totalPrice: newTotalPrice,
          },
        })
      },
      removeCoupon: () => {
        const cart = get().cart
        // Restore total by adding back the discount
        const newTotalPrice = cart.totalPrice + (cart.discountAmount || 0)
        set({
          cart: {
            ...cart,
            coupon: undefined,
            discountAmount: undefined,
            totalPrice: newTotalPrice,
          },
        })
      },
      clearCart: () => {
        set({
          cart: {
            ...get().cart,
            items: [],
            coupon: undefined,
            discountAmount: undefined,
          },
        })
      },
      init: () => set({ cart: initialState }),
    }),

    {
      name: 'cart-store',
    }
  )
)
export default useCartStore
