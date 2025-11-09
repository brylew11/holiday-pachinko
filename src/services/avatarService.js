import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../firebase'

/**
 * Fetches avatar generation settings from Firestore
 * @returns {Promise<Object>} Settings object with geminiAvatarPrompt, placeholderAvatarUrl, enabled
 */
export async function fetchAvatarSettings() {
  try {
    const settingsRef = doc(db, 'settings', 'avatarGeneration')
    const settingsDoc = await getDoc(settingsRef)

    if (!settingsDoc.exists()) {
      // Return default values if document doesn't exist
      return {
        geminiAvatarPrompt: 'Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression',
        placeholderAvatarUrl: 'https://via.placeholder.com/512',
        enabled: true
      }
    }

    const data = settingsDoc.data()
    return {
      geminiAvatarPrompt: data.geminiAvatarPrompt || '',
      placeholderAvatarUrl: data.placeholderAvatarUrl || 'https://via.placeholder.com/512',
      enabled: data.enabled !== undefined ? data.enabled : true
    }
  } catch (error) {
    throw new Error('Unable to fetch avatar settings. Please try again.')
  }
}

/**
 * Updates the Gemini avatar prompt in Firestore settings
 * @param {Object} params - Update parameters
 * @param {string} params.geminiAvatarPrompt - New prompt text
 * @returns {Promise<Object>} Updated settings object
 */
export async function updateAvatarPrompt({ geminiAvatarPrompt }) {
  try {
    const settingsRef = doc(db, 'settings', 'avatarGeneration')

    // Check if document exists
    const settingsDoc = await getDoc(settingsRef)

    if (!settingsDoc.exists()) {
      // Create document if it doesn't exist
      await setDoc(settingsRef, {
        geminiAvatarPrompt,
        placeholderAvatarUrl: 'https://via.placeholder.com/512',
        enabled: true
      })
    } else {
      // Update existing document
      await updateDoc(settingsRef, {
        geminiAvatarPrompt
      })
    }

    // Return updated settings
    return fetchAvatarSettings()
  } catch (error) {
    throw new Error('Unable to update avatar prompt. Please try again.')
  }
}

/**
 * Triggers manual regeneration of a player's avatar
 * @param {Object} params - Regeneration parameters
 * @param {string} params.playerId - Player document ID
 * @param {string} params.originalPhotoUrl - Player's original photo URL
 * @returns {Promise<Object>} Result from Cloud Function
 */
export async function regenerateAvatar({ playerId, originalPhotoUrl }) {
  try {
    const functions = getFunctions()
    const regenerateFunction = httpsCallable(functions, 'generatePlayerAvatar')

    const result = await regenerateFunction({
      playerId,
      originalPhotoUrl
    })

    return result.data
  } catch (error) {
    // Handle Cloud Function errors
    if (error.code === 'functions/deadline-exceeded') {
      throw new Error('Avatar generation timed out. Please try again.')
    } else if (error.code === 'functions/unavailable') {
      throw new Error('Avatar generation service is currently unavailable. Please try again later.')
    } else if (error.message) {
      throw new Error(`Failed to regenerate avatar: ${error.message}`)
    } else {
      throw new Error('Unable to regenerate avatar. Please try again.')
    }
  }
}
