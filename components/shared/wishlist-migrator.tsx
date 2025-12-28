'use client'

import useWishlistStore from '@/hooks/use-wishlist-store'
import { getWishlistProductIds, migrateLocalWishlist } from '@/lib/actions/wishlist.actions'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

/**
 * Component to handle wishlist migration when user logs in
 * Syncs local wishlist items to server and merges server wishlist to local
 */
export default function WishlistMigrator() {
  const { data: session, status } = useSession()
  const { 
    getItemsToMigrate, 
    markMigrationComplete, 
    mergeWithServer, 
    hasMigrated,
    setInitialized 
  } = useWishlistStore()
  
  const migrationAttempted = useRef(false)

  useEffect(() => {
    const handleMigration = async () => {
      // Only run once per session
      if (migrationAttempted.current) return
      
      // Wait for session to be determined
      if (status === 'loading') return
      
      // If user is logged in and hasn't migrated yet
      if (session?.user && !hasMigrated) {
        migrationAttempted.current = true
        
        try {
          // Get local items to migrate
          const localItems = getItemsToMigrate()
          
          // Migrate local items to server if any
          if (localItems.length > 0) {
            await migrateLocalWishlist(localItems)
          }
          
          // Get server wishlist and merge
          const serverIds = await getWishlistProductIds()
          mergeWithServer(serverIds)
          
          // Mark migration as complete
          markMigrationComplete()
        } catch (error) {
          console.error('Wishlist migration failed:', error)
        }
      }
      
      // Mark as initialized regardless of login status
      setInitialized(true)
    }

    handleMigration()
  }, [session, status, hasMigrated, getItemsToMigrate, markMigrationComplete, mergeWithServer, setInitialized])

  // This component doesn't render anything
  return null
}
