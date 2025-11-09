import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fetchAvatarSettings, updateAvatarPrompt, regenerateAvatar } from '../avatarService'

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  functions: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn()
}))

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn()
}))

describe('avatarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAvatarSettings', () => {
    test('should retrieve settings document from Firestore', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          geminiAvatarPrompt: 'Test prompt',
          placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
          enabled: true
        })
      })

      const settings = await fetchAvatarSettings()

      expect(settings.geminiAvatarPrompt).toBe('Test prompt')
      expect(settings.placeholderAvatarUrl).toBe('https://test.com/placeholder.jpg')
      expect(settings.enabled).toBe(true)
    })

    test('should return default values when document does not exist', async () => {
      const { getDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => false
      })

      const settings = await fetchAvatarSettings()

      expect(settings.geminiAvatarPrompt).toContain('cartoon elf')
      expect(settings.enabled).toBe(true)
    })
  })

  describe('updateAvatarPrompt', () => {
    test('should save updated prompt to Firestore settings document', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore')

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          geminiAvatarPrompt: 'Old prompt',
          placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
          enabled: true
        })
      })

      updateDoc.mockResolvedValue()

      const newPrompt = 'New test prompt'
      await updateAvatarPrompt({ geminiAvatarPrompt: newPrompt })

      expect(updateDoc).toHaveBeenCalled()
    })
  })

  describe('regenerateAvatar', () => {
    test('should trigger Cloud Function call with playerId', async () => {
      const { httpsCallable } = await import('firebase/functions')

      const mockCallable = vi.fn().mockResolvedValue({
        data: { success: true, avatarUrl: 'https://test.com/avatar.jpg' }
      })

      httpsCallable.mockReturnValue(mockCallable)

      const result = await regenerateAvatar({
        playerId: 'player-123',
        originalPhotoUrl: 'https://test.com/photo.jpg'
      })

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'generatePlayerAvatar')
      expect(mockCallable).toHaveBeenCalledWith({
        playerId: 'player-123',
        originalPhotoUrl: 'https://test.com/photo.jpg'
      })
      expect(result.success).toBe(true)
    })
  })
})
