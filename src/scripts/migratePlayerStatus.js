import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

/**
 * Migration script to add 'status' field to existing player documents
 * This script is idempotent - safe to run multiple times
 */
async function migratePlayerStatus() {
  console.log('Starting player status migration...')

  try {
    // Query all documents in 'players' collection
    const playersCollection = collection(db, 'players')
    const querySnapshot = await getDocs(playersCollection)

    let updatedCount = 0
    let skippedCount = 0

    // Iterate through all player documents
    for (const docSnapshot of querySnapshot.docs) {
      const playerData = docSnapshot.data()

      // Check if 'status' field already exists
      if (!playerData.status) {
        // Add status: 'active' to documents missing the field
        const docRef = doc(db, 'players', docSnapshot.id)
        await updateDoc(docRef, {
          status: 'active'
        })
        updatedCount++
        console.log(`Updated player: ${docSnapshot.id} - ${playerData.name}`)
      } else {
        skippedCount++
        console.log(`Skipped player (already has status): ${docSnapshot.id} - ${playerData.name}`)
      }
    }

    // Log migration results
    console.log('\n=== Migration Complete ===')
    console.log(`Total documents processed: ${querySnapshot.size}`)
    console.log(`Documents updated: ${updatedCount}`)
    console.log(`Documents skipped: ${skippedCount}`)
    console.log('===========================\n')

    return {
      total: querySnapshot.size,
      updated: updatedCount,
      skipped: skippedCount
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration
migratePlayerStatus()
  .then(() => {
    console.log('Migration script executed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
