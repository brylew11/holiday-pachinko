import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
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
      status: 'processing'
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
      status: 'processing'
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
