import { z } from 'zod'
import { getFileValidationError } from './fileValidation'

export const playerFormSchema = z.object({
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .trim(),

  playerImage: z
    .custom((value) => {
      // Check if value is a File object
      if (!(value instanceof File)) {
        return false
      }
      return true
    }, 'Please select an image file')
    .refine(
      (file) => {
        const error = getFileValidationError(file)
        return error === null
      },
      (file) => {
        const error = getFileValidationError(file)
        return { message: error || 'Invalid file' }
      }
    )
})
