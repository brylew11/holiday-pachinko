/**
 * Validates file type for image uploads
 * @param {File} file - The file to validate
 * @returns {boolean} True if file type is valid
 */
export function validateFileType(file) {
  if (!file) return false

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Validates file size
 * @param {File} file - The file to validate
 * @returns {boolean} True if file size is within limit
 */
export function validateFileSize(file) {
  if (!file) return false

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB in bytes
  return file.size <= MAX_SIZE
}

/**
 * Gets user-friendly validation error message for file
 * @param {File} file - The file to validate
 * @returns {string|null} Error message or null if valid
 */
export function getFileValidationError(file) {
  if (!file) {
    return 'Please select an image file'
  }

  if (!validateFileType(file)) {
    return 'Please select a JPEG, PNG, or WebP image'
  }

  if (!validateFileSize(file)) {
    return 'Image size must be less than 5MB'
  }

  return null
}
