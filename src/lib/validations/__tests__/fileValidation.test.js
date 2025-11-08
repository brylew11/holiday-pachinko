import { describe, it, expect } from 'vitest'
import { validateFileType, validateFileSize, getFileValidationError } from '../fileValidation'

describe('File Validation', () => {
  describe('validateFileType', () => {
    it('should accept JPEG files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFileType(file)).toBe(true)
    })

    it('should accept PNG files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      expect(validateFileType(file)).toBe(true)
    })

    it('should accept WebP files', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' })
      expect(validateFileType(file)).toBe(true)
    })

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      expect(validateFileType(file)).toBe(false)
    })

    it('should return false for null', () => {
      expect(validateFileType(null)).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('should accept files under 5MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFileSize(file)).toBe(true)
    })

    it('should accept files exactly 5MB', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFileSize(file)).toBe(true)
    })

    it('should reject files over 5MB', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFileSize(file)).toBe(false)
    })

    it('should return false for null', () => {
      expect(validateFileSize(null)).toBe(false)
    })
  })

  describe('getFileValidationError', () => {
    it('should return null for valid file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(getFileValidationError(file)).toBeNull()
    })

    it('should return error for missing file', () => {
      expect(getFileValidationError(null)).toBe('Please select an image file')
    })

    it('should return error for invalid file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      expect(getFileValidationError(file)).toBe('Please select a JPEG, PNG, or WebP image')
    })

    it('should return error for oversized file', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
      expect(getFileValidationError(file)).toBe('Image size must be less than 5MB')
    })
  })
})
