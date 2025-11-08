import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadPlayerImage, createPlayerDocument, createPlayer } from '../playerService'

// Mock Firebase Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
}))

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'

describe('Player Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadPlayerImage', () => {
    it('should upload image and return download URL', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockDownloadURL = 'https://storage.googleapis.com/test/uploads/123-test.jpg'

      ref.mockReturnValue({ path: 'uploads/123-test.jpg' })
      uploadBytes.mockResolvedValue({})
      getDownloadURL.mockResolvedValue(mockDownloadURL)

      // Act
      const result = await uploadPlayerImage(mockFile)

      // Assert
      expect(result).toBe(mockDownloadURL)
      expect(ref).toHaveBeenCalled()
      expect(uploadBytes).toHaveBeenCalled()
      expect(getDownloadURL).toHaveBeenCalled()
    })

    it('should throw error when upload fails', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      uploadBytes.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(uploadPlayerImage(mockFile)).rejects.toThrow('Failed to upload image')
    })
  })

  describe('createPlayerDocument', () => {
    it('should create player document with correct fields', async () => {
      // Arrange
      const playerData = {
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.googleapis.com/test/uploads/123-test.jpg'
      }
      const mockDocRef = { id: 'player123' }

      collection.mockReturnValue({ path: 'players' })
      addDoc.mockResolvedValue(mockDocRef)

      // Act
      const result = await createPlayerDocument(playerData)

      // Assert
      expect(result).toBe(mockDocRef)
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'players')
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'John Doe',
          originalPhotoUrl: playerData.originalPhotoUrl,
          status: 'processing'
        })
      )
    })

    it('should throw error when Firestore write fails', async () => {
      // Arrange
      const playerData = {
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.googleapis.com/test/uploads/123-test.jpg'
      }
      addDoc.mockRejectedValue(new Error('Permission denied'))

      // Act & Assert
      await expect(createPlayerDocument(playerData)).rejects.toThrow('Failed to create player document')
    })
  })

  describe('createPlayer', () => {
    it('should orchestrate complete player creation workflow', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockDownloadURL = 'https://storage.googleapis.com/test/uploads/123-test.jpg'
      const mockDocRef = { id: 'player123' }

      ref.mockReturnValue({ path: 'uploads/123-test.jpg' })
      uploadBytes.mockResolvedValue({})
      getDownloadURL.mockResolvedValue(mockDownloadURL)
      collection.mockReturnValue({ path: 'players' })
      addDoc.mockResolvedValue(mockDocRef)

      // Act
      const result = await createPlayer({ name: 'John Doe', imageFile: mockFile })

      // Assert
      expect(result).toEqual({
        id: 'player123',
        name: 'John Doe',
        originalPhotoUrl: mockDownloadURL,
        status: 'processing'
      })
    })

    it('should throw user-friendly error when upload fails', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      uploadBytes.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(createPlayer({ name: 'John Doe', imageFile: mockFile }))
        .rejects.toThrow('Unable to upload player image')
    })
  })
})
