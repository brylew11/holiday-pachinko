import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadPlayerImage,
  createPlayerDocument,
  createPlayer,
  fetchPlayers,
  updatePlayer,
  deactivatePlayer,
  deletePlayer,
  deletePlayerImage
} from '../playerService'

// Mock Firebase Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}))

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'

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
    it('should create player document with status active', async () => {
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
          status: 'active'
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
        status: 'active'
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

  describe('fetchPlayers', () => {
    it('should return array of players with correct schema', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'player1',
          data: () => ({
            name: 'John Doe',
            originalPhotoUrl: 'https://storage.googleapis.com/test/player1.jpg',
            status: 'active'
          })
        },
        {
          id: 'player2',
          data: () => ({
            name: 'Jane Smith',
            originalPhotoUrl: 'https://storage.googleapis.com/test/player2.jpg',
            status: 'inactive'
          })
        }
      ]

      getDocs.mockResolvedValue({ docs: mockDocs })

      // Act
      const result = await fetchPlayers()

      // Assert
      expect(result).toEqual([
        {
          id: 'player1',
          name: 'John Doe',
          originalPhotoUrl: 'https://storage.googleapis.com/test/player1.jpg',
          status: 'active'
        },
        {
          id: 'player2',
          name: 'Jane Smith',
          originalPhotoUrl: 'https://storage.googleapis.com/test/player2.jpg',
          status: 'inactive'
        }
      ])
    })

    it('should return empty array when no players exist', async () => {
      // Arrange
      getDocs.mockResolvedValue({ docs: [] })

      // Act
      const result = await fetchPlayers()

      // Assert
      expect(result).toEqual([])
    })

    it('should throw user-friendly error on fetch failure', async () => {
      // Arrange
      getDocs.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(fetchPlayers()).rejects.toThrow('Unable to fetch players')
    })
  })

  describe('updatePlayer', () => {
    it('should update player fields correctly', async () => {
      // Arrange
      const updateData = {
        playerId: 'player123',
        name: 'Updated Name',
        originalPhotoUrl: 'https://storage.googleapis.com/test/new-photo.jpg'
      }

      doc.mockReturnValue({ id: 'player123' })
      updateDoc.mockResolvedValue({})

      // Act
      const result = await updatePlayer(updateData)

      // Assert
      expect(result).toEqual({
        id: 'player123',
        name: 'Updated Name',
        originalPhotoUrl: 'https://storage.googleapis.com/test/new-photo.jpg'
      })
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          name: 'Updated Name',
          originalPhotoUrl: 'https://storage.googleapis.com/test/new-photo.jpg'
        }
      )
    })

    it('should throw user-friendly error on update failure', async () => {
      // Arrange
      updateDoc.mockRejectedValue(new Error('Permission denied'))

      // Act & Assert
      await expect(updatePlayer({
        playerId: 'player123',
        name: 'Test'
      })).rejects.toThrow('Unable to update player')
    })
  })

  describe('deactivatePlayer', () => {
    it('should set player status to inactive', async () => {
      // Arrange
      doc.mockReturnValue({ id: 'player123' })
      updateDoc.mockResolvedValue({})

      // Act
      const result = await deactivatePlayer('player123')

      // Assert
      expect(result).toEqual({
        id: 'player123',
        status: 'inactive'
      })
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { status: 'inactive' }
      )
    })

    it('should throw user-friendly error on deactivation failure', async () => {
      // Arrange
      updateDoc.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(deactivatePlayer('player123'))
        .rejects.toThrow('Unable to deactivate player')
    })
  })

  describe('deletePlayer', () => {
    it('should remove both document and image', async () => {
      // Arrange
      const deleteData = {
        playerId: 'player123',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/uploads%2Ftest.jpg?alt=media&token=123'
      }

      doc.mockReturnValue({ id: 'player123' })
      deleteDoc.mockResolvedValue({})
      deleteObject.mockResolvedValue({})

      // Act
      const result = await deletePlayer(deleteData)

      // Assert
      expect(result).toEqual({
        success: true,
        id: 'player123'
      })
      expect(deleteDoc).toHaveBeenCalled()
      expect(deleteObject).toHaveBeenCalled()
    })

    it('should still delete document even if image deletion fails', async () => {
      // Arrange
      const deleteData = {
        playerId: 'player123',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/uploads%2Ftest.jpg?alt=media&token=123'
      }

      doc.mockReturnValue({ id: 'player123' })
      deleteDoc.mockResolvedValue({})
      deleteObject.mockRejectedValue(new Error('Image not found'))

      // Act
      const result = await deletePlayer(deleteData)

      // Assert
      expect(result).toEqual({
        success: true,
        id: 'player123'
      })
      expect(deleteDoc).toHaveBeenCalled()
    })
  })

  describe('deletePlayerImage', () => {
    it('should handle missing images gracefully', async () => {
      // Arrange
      const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/test/o/uploads%2Ftest.jpg?alt=media&token=123'
      const error = new Error('Not found')
      error.code = 'storage/object-not-found'
      deleteObject.mockRejectedValue(error)

      // Act & Assert - should not throw
      await expect(deletePlayerImage(imageUrl)).resolves.toBeUndefined()
    })
  })
})
