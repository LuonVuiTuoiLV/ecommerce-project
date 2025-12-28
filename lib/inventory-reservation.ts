/**
 * Simple in-memory inventory reservation system
 * Prevents overselling during checkout process
 * For production, consider using Redis with TTL
 */

interface Reservation {
  productId: string
  quantity: number
  userId: string
  expiresAt: number
}

// In-memory store for reservations
const reservations = new Map<string, Reservation>()

// Reservation TTL: 15 minutes
const RESERVATION_TTL = 15 * 60 * 1000

// Cleanup interval: 1 minute
const CLEANUP_INTERVAL = 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, reservation] of reservations.entries()) {
      if (reservation.expiresAt < now) {
        reservations.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Create a reservation for a product
 * @returns reservation key if successful, null if not enough stock
 */
export function createReservation(
  productId: string,
  quantity: number,
  userId: string,
  availableStock: number
): string | null {
  startCleanup()
  
  // Calculate total reserved quantity for this product
  const totalReserved = getTotalReserved(productId)
  const effectiveStock = availableStock - totalReserved
  
  if (effectiveStock < quantity) {
    return null // Not enough stock
  }
  
  const reservationKey = `${userId}:${productId}:${Date.now()}`
  reservations.set(reservationKey, {
    productId,
    quantity,
    userId,
    expiresAt: Date.now() + RESERVATION_TTL,
  })
  
  return reservationKey
}

/**
 * Get total reserved quantity for a product
 */
export function getTotalReserved(productId: string): number {
  const now = Date.now()
  let total = 0
  
  for (const reservation of reservations.values()) {
    if (reservation.productId === productId && reservation.expiresAt > now) {
      total += reservation.quantity
    }
  }
  
  return total
}

/**
 * Get effective available stock (actual stock - reserved)
 */
export function getEffectiveStock(productId: string, actualStock: number): number {
  return Math.max(0, actualStock - getTotalReserved(productId))
}

/**
 * Release a reservation (after order is placed or cancelled)
 */
export function releaseReservation(reservationKey: string): boolean {
  return reservations.delete(reservationKey)
}

/**
 * Release all reservations for a user
 */
export function releaseUserReservations(userId: string): number {
  let released = 0
  
  for (const [key, reservation] of reservations.entries()) {
    if (reservation.userId === userId) {
      reservations.delete(key)
      released++
    }
  }
  
  return released
}

/**
 * Extend reservation TTL (when user is still active in checkout)
 */
export function extendReservation(reservationKey: string): boolean {
  const reservation = reservations.get(reservationKey)
  if (!reservation) return false
  
  reservation.expiresAt = Date.now() + RESERVATION_TTL
  return true
}

/**
 * Check if a reservation is still valid
 */
export function isReservationValid(reservationKey: string): boolean {
  const reservation = reservations.get(reservationKey)
  if (!reservation) return false
  
  return reservation.expiresAt > Date.now()
}

/**
 * Get reservation details
 */
export function getReservation(reservationKey: string): Reservation | null {
  const reservation = reservations.get(reservationKey)
  if (!reservation || reservation.expiresAt < Date.now()) {
    return null
  }
  return reservation
}
