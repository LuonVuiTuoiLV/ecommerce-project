import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  // For guest users - store product IDs locally
  localWishlist: string[]
  // For logged in users - synced from server
  serverWishlist: string[]
  // Combined wishlist for display
  isInitialized: boolean
  // Track if local wishlist has been migrated to server
  hasMigrated: boolean

  // Actions
  addToLocalWishlist: (productId: string) => void
  removeFromLocalWishlist: (productId: string) => void
  toggleLocalWishlist: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
  setServerWishlist: (productIds: string[]) => void
  clearLocalWishlist: () => void
  getWishlistCount: () => number
  setInitialized: (value: boolean) => void
  // New: Get items to migrate when user logs in
  getItemsToMigrate: () => string[]
  // New: Mark migration as complete
  markMigrationComplete: () => void
  // New: Merge server wishlist with local (for sync after login)
  mergeWithServer: (serverIds: string[]) => void
}

const useWishlistStore = create(
  persist<WishlistState>(
    (set, get) => ({
      localWishlist: [],
      serverWishlist: [],
      isInitialized: false,
      hasMigrated: false,

      addToLocalWishlist: (productId: string) => {
        const { localWishlist } = get()
        if (!localWishlist.includes(productId)) {
          set({ localWishlist: [...localWishlist, productId] })
        }
      },

      removeFromLocalWishlist: (productId: string) => {
        const { localWishlist } = get()
        set({ localWishlist: localWishlist.filter((id) => id !== productId) })
      },

      toggleLocalWishlist: (productId: string) => {
        const { localWishlist } = get()
        if (localWishlist.includes(productId)) {
          set({ localWishlist: localWishlist.filter((id) => id !== productId) })
          return false // removed
        } else {
          set({ localWishlist: [...localWishlist, productId] })
          return true // added
        }
      },

      isInWishlist: (productId: string) => {
        const { localWishlist, serverWishlist } = get()
        return localWishlist.includes(productId) || serverWishlist.includes(productId)
      },

      setServerWishlist: (productIds: string[]) => {
        set({ serverWishlist: productIds })
      },

      clearLocalWishlist: () => {
        set({ localWishlist: [] })
      },

      getWishlistCount: () => {
        const { localWishlist, serverWishlist } = get()
        // Combine and deduplicate
        const combined = new Set([...localWishlist, ...serverWishlist])
        return combined.size
      },

      setInitialized: (value: boolean) => {
        set({ isInitialized: value })
      },

      // Get local items that need to be migrated to server
      getItemsToMigrate: () => {
        const { localWishlist, serverWishlist, hasMigrated } = get()
        if (hasMigrated) return []
        // Return items in local but not in server
        return localWishlist.filter((id) => !serverWishlist.includes(id))
      },

      // Mark migration as complete and clear local wishlist
      markMigrationComplete: () => {
        set({ hasMigrated: true, localWishlist: [] })
      },

      // Merge server wishlist with local after login
      mergeWithServer: (serverIds: string[]) => {
        const { localWishlist } = get()
        // Combine and deduplicate
        const combined = [...new Set([...serverIds, ...localWishlist])]
        set({ 
          serverWishlist: combined,
          // Keep local wishlist until migration is complete
        })
      },
    }),
    {
      name: 'wishlist-store',
      partialize: (state) => ({
        localWishlist: state.localWishlist,
        hasMigrated: state.hasMigrated,
      } as WishlistState),
    }
  )
)

export default useWishlistStore
