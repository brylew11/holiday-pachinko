import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { storage, db } from '../firebase'

/**
 * Uploads a player image to Firebase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export async function uploadPlayerImage(file) {
  try {
    // Generate unique filename using timestamp
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${file.name}`

    // Create storage reference in 'uploads/' folder
    const storageRef = ref(storage, `uploads/${uniqueFilename}`)

    // Upload file
    await uploadBytes(storageRef, file)

    // Get and return download URL
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Creates a player document in Firestore
 * @param {Object} playerData - Player data
 * @param {string} playerData.name - Player name
 * @param {string} playerData.originalPhotoUrl - Firebase Storage URL of player image
 * @returns {Promise<Object>} The created document reference
 */
export async function createPlayerDocument({ name, originalPhotoUrl }) {
  try {
    // Create reference to 'players' collection
    const playersCollection = collection(db, 'players')

    // Create document with required fields
    const docRef = await addDoc(playersCollection, {
      name,
      originalPhotoUrl,
      status: 'active'
    })

    return docRef
  } catch (error) {
    throw new Error(`Failed to create player document: ${error.message}`)
  }
}

/**
 * Orchestrates the complete player creation workflow
 * @param {Object} params - Player creation parameters
 * @param {string} params.name - Player name
 * @param {File} params.imageFile - Player image file
 * @returns {Promise<Object>} Created player data
 */
export async function createPlayer({ name, imageFile }) {
  try {
    // Upload image and get download URL
    const originalPhotoUrl = await uploadPlayerImage(imageFile)

    // Create player document in Firestore
    const docRef = await createPlayerDocument({ name, originalPhotoUrl })

    // Return complete player data
    return {
      id: docRef.id,
      name,
      originalPhotoUrl,
      status: 'active'
    }
  } catch (error) {
    // Re-throw with user-friendly message
    if (error.message.includes('Failed to upload image')) {
      throw new Error('Unable to upload player image. Please check your connection and try again.')
    } else if (error.message.includes('Failed to create player document')) {
      throw new Error('Unable to save player information. Please try again.')
    } else {
      throw new Error('An unexpected error occurred. Please try again.')
    }
  }
}

/**
 * Fetches all players from Firestore
 * @returns {Promise<Array>} Array of player objects
 */
export async function fetchPlayers() {
  try {
    const playersCollection = collection(db, 'players')
    const querySnapshot = await getDocs(playersCollection)

    // Map Firestore document snapshots to plain JavaScript objects
    const players = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      originalPhotoUrl: doc.data().originalPhotoUrl,
      status: doc.data().status || 'active'
    }))

    return players
  } catch (error) {
    throw new Error('Unable to fetch players. Please check your connection and try again.')
  }
}

/**
 * Updates a player's name and/or photo
 * @param {Object} params - Update parameters
 * @param {string} params.playerId - Player document ID
 * @param {string} params.name - New player name
 * @param {string} params.originalPhotoUrl - New photo URL
 * @returns {Promise<Object>} Updated player data
 */
export async function updatePlayer({ playerId, name, originalPhotoUrl }) {
  try {
    const docRef = doc(db, 'players', playerId)

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (originalPhotoUrl !== undefined) updateData.originalPhotoUrl = originalPhotoUrl

    await updateDoc(docRef, updateData)

    return {
      id: playerId,
      ...updateData
    }
  } catch (error) {
    throw new Error('Unable to update player. Please try again.')
  }
}

/**
 * Deactivates a player (soft delete)
 * @param {string} playerId - Player document ID
 * @returns {Promise<Object>} Updated player data
 */
export async function deactivatePlayer(playerId) {
  try {
    const docRef = doc(db, 'players', playerId)
    await updateDoc(docRef, {
      status: 'inactive'
    })

    return {
      id: playerId,
      status: 'inactive'
    }
  } catch (error) {
    throw new Error('Unable to deactivate player. Please try again.')
  }
}

/**
 * Deletes a player image from Firebase Storage
 * @param {string} imageUrl - Firebase Storage URL
 * @returns {Promise<void>}
 */
export async function deletePlayerImage(imageUrl) {
  try {
    // Extract storage path from full URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)$/)

    if (!pathMatch) {
      console.warn('Could not extract storage path from URL:', imageUrl)
      return
    }

    const storagePath = decodeURIComponent(pathMatch[1])
    const storageRef = ref(storage, storagePath)

    await deleteObject(storageRef)
  } catch (error) {
    // Handle gracefully if image doesn't exist
    if (error.code === 'storage/object-not-found') {
      console.warn('Image not found in storage, skipping deletion:', imageUrl)
      return
    }
    // Throw for other errors
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Permanently deletes a player from Firestore and Storage
 * @param {Object} params - Delete parameters
 * @param {string} params.playerId - Player document ID
 * @param {string} params.imageUrl - Player image URL
 * @returns {Promise<Object>} Success confirmation
 */
export async function deletePlayer({ playerId, imageUrl }) {
  try {
    // First attempt to delete image
    try {
      if (imageUrl) {
        await deletePlayerImage(imageUrl)
      }
    } catch (imageError) {
      // Log warning but continue with document deletion
      console.warn('Failed to delete player image, but will continue with document deletion:', imageError)
    }

    // Delete Firestore document
    const docRef = doc(db, 'players', playerId)
    await deleteDoc(docRef)

    return {
      success: true,
      id: playerId
    }
  } catch (error) {
    throw new Error('Unable to delete player. Please try again.')
  }
}
