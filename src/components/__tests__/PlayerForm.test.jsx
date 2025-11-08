import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerForm } from '../PlayerForm'

// Mock the player service
vi.mock('../../services/playerService', () => ({
  createPlayer: vi.fn(() => Promise.resolve({ id: '123', name: 'Test Player', status: 'active' })),
  updatePlayer: vi.fn(() => Promise.resolve({ id: '123', name: 'Updated Player' })),
  uploadPlayerImage: vi.fn(() => Promise.resolve('https://storage.example.com/new-image.jpg')),
  deletePlayerImage: vi.fn(() => Promise.resolve()),
}))

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderPlayerForm = (props = {}) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <PlayerForm {...props} />
    </QueryClientProvider>
  )
}

describe('PlayerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Add Mode', () => {
    it('should render form with all required fields', () => {
      renderPlayerForm()

      expect(screen.getByText('Add New Player')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter player name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add player/i })).toBeInTheDocument()
    })

    it('should validate required player name field on blur', async () => {
      const user = userEvent.setup()
      renderPlayerForm()

      const nameInput = screen.getByPlaceholderText(/enter player name/i)

      // Focus and blur without entering value
      await user.click(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/player name is required/i)).toBeInTheDocument()
      })
    })

    it('should show image preview when file is selected', async () => {
      const user = userEvent.setup()
      renderPlayerForm()

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]')

      await user.upload(fileInput, file)

      await waitFor(() => {
        const preview = screen.getByAltText(/preview of test.jpg/i)
        expect(preview).toBeInTheDocument()
        expect(screen.getByText('test.jpg')).toBeInTheDocument()
      })
    })

    it('should disable submit button when form is incomplete', async () => {
      renderPlayerForm()

      const nameInput = screen.getByPlaceholderText(/enter player name/i)
      const submitButton = screen.getByRole('button', { name: /add player/i })

      // Initially disabled (no data)
      expect(submitButton).toBeDisabled()

      // After adding name, still disabled (no file)
      await userEvent.type(nameInput, 'John Doe')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Update Mode', () => {
    const mockPlayer = {
      id: 'player123',
      name: 'John Doe',
      originalPhotoUrl: 'https://storage.example.com/player.jpg',
      status: 'active'
    }

    it('should change title to "Update Player" in update mode', () => {
      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer })

      expect(screen.getByText('Update Player')).toBeInTheDocument()
      expect(screen.queryByText('Add New Player')).not.toBeInTheDocument()
    })

    it('should populate form with player data', async () => {
      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/enter player name/i)
        expect(nameInput).toHaveValue('John Doe')
      })

      const playerImage = screen.getByAltText('Player image')
      expect(playerImage).toBeInTheDocument()
      expect(playerImage).toHaveAttribute('src', mockPlayer.originalPhotoUrl)
    })

    it('should change submit button text to "Update Player"', async () => {
      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer })

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /^update player$/i })
        expect(submitButton).toBeInTheDocument()
      })
    })

    it('should show Cancel button in update mode', async () => {
      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer })

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).toBeInTheDocument()
      })
    })

    it('should call onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer, onCancel })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should trigger update mutation on submit', async () => {
      const user = userEvent.setup()
      const { updatePlayer } = await import('../../services/playerService')

      renderPlayerForm({ mode: 'update', selectedPlayer: mockPlayer })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^update player$/i })).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/enter player name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const submitButton = screen.getByRole('button', { name: /^update player$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(updatePlayer).toHaveBeenCalled()
      })
    })
  })
})
