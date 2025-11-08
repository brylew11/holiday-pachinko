import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../../App'
import * as playerService from '../../services/playerService'

// Mock the player service
vi.mock('../../services/playerService', () => ({
  createPlayer: vi.fn()
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderApp = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe('Player Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full player creation workflow successfully', async () => {
    const user = userEvent.setup()

    // Mock successful player creation
    playerService.createPlayer.mockResolvedValue({
      id: 'player-123',
      name: 'John Doe',
      originalPhotoUrl: 'https://storage.googleapis.com/test/uploads/123-photo.jpg',
      status: 'processing'
    })

    renderApp()

    // Fill in player name
    const nameInput = screen.getByPlaceholderText(/enter player name/i)
    await user.type(nameInput, 'John Doe')

    // Upload image
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    // Wait for preview to appear
    await waitFor(() => {
      expect(screen.getByAltText(/preview of photo.jpg/i)).toBeInTheDocument()
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add player/i })
    await user.click(submitButton)

    // Verify service was called
    await waitFor(() => {
      expect(playerService.createPlayer).toHaveBeenCalled()
      const callArgs = playerService.createPlayer.mock.calls[0][0]
      expect(callArgs.name).toBe('John Doe')
      expect(callArgs.imageFile).toBeInstanceOf(File)
    })
  })

  it('should handle upload failure gracefully', async () => {
    const user = userEvent.setup()

    // Mock upload failure
    playerService.createPlayer.mockRejectedValue(
      new Error('Unable to upload player image. Please check your connection and try again.')
    )

    renderApp()

    // Fill form
    const nameInput = screen.getByPlaceholderText(/enter player name/i)
    await user.type(nameInput, 'Jane Doe')

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    // Submit form
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add player/i })).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /add player/i })
    await user.click(submitButton)

    // Verify error is handled
    await waitFor(() => {
      expect(playerService.createPlayer).toHaveBeenCalled()
    })
  })

  it('should validate form before allowing submission', async () => {
    const user = userEvent.setup()
    renderApp()

    const submitButton = screen.getByRole('button', { name: /add player/i })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // Add name only - still disabled
    const nameInput = screen.getByPlaceholderText(/enter player name/i)
    await user.type(nameInput, 'Test Player')
    expect(submitButton).toBeDisabled()

    // Add file - should enable
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    // Service should not be called yet
    expect(playerService.createPlayer).not.toHaveBeenCalled()
  })

  it('should handle form reset after successful submission', async () => {
    const user = userEvent.setup()

    playerService.createPlayer.mockResolvedValue({
      id: 'player-456',
      name: 'Test Player',
      originalPhotoUrl: 'https://storage.googleapis.com/test/uploads/456-test.jpg',
      status: 'processing'
    })

    renderApp()

    // Fill and submit form
    const nameInput = screen.getByPlaceholderText(/enter player name/i)
    await user.type(nameInput, 'Test Player')

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByAltText(/preview of test.jpg/i)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /add player/i })
    await user.click(submitButton)

    // Wait for form reset (preview should disappear)
    await waitFor(() => {
      expect(screen.queryByAltText(/preview of test.jpg/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Form should be reset
    expect(nameInput.value).toBe('')
  })

  it('should prevent multiple simultaneous submissions', async () => {
    const user = userEvent.setup()

    // Mock slow submission
    playerService.createPlayer.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        id: 'player-789',
        name: 'Slow Player',
        status: 'processing'
      }), 1000))
    )

    renderApp()

    // Fill form
    const nameInput = screen.getByPlaceholderText(/enter player name/i)
    await user.type(nameInput, 'Slow Player')

    const file = new File(['test'], 'slow.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    const submitButton = screen.getByRole('button', { name: /add player/i })

    // Click submit
    await user.click(submitButton)

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText(/adding player/i)).toBeInTheDocument()
    })

    // Service should only be called once
    expect(playerService.createPlayer).toHaveBeenCalledTimes(1)
  })
})
