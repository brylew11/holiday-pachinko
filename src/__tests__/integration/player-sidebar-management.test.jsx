import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../../App'

// Mock the player service
const mockFetchPlayers = vi.fn()
const mockCreatePlayer = vi.fn()
const mockUpdatePlayer = vi.fn()
const mockDeactivatePlayer = vi.fn()
const mockDeletePlayer = vi.fn()
const mockUploadPlayerImage = vi.fn()
const mockDeletePlayerImage = vi.fn()

vi.mock('../../services/playerService', () => ({
  fetchPlayers: () => mockFetchPlayers(),
  createPlayer: (data) => mockCreatePlayer(data),
  updatePlayer: (data) => mockUpdatePlayer(data),
  deactivatePlayer: (playerId) => mockDeactivatePlayer(playerId),
  deletePlayer: (data) => mockDeletePlayer(data),
  uploadPlayerImage: (file) => mockUploadPlayerImage(file),
  deletePlayerImage: (url) => mockDeletePlayerImage(url),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Create a test query client
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

describe('Player Sidebar Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Player Selection and Edit Workflow', () => {
    const mockPlayers = [
      {
        id: 'player1',
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg',
        status: 'active'
      },
      {
        id: 'player2',
        name: 'Jane Smith',
        originalPhotoUrl: 'https://storage.example.com/player2.jpg',
        status: 'active'
      }
    ]

    it('should allow selecting a player and switching form to edit mode', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Initially form should be in add mode
      expect(screen.getByText('Add New Player')).toBeInTheDocument()

      // Click on a player
      const playerItem = screen.getByText('John Doe').closest('div')
      await user.click(playerItem)

      // Form should switch to update mode
      await waitFor(() => {
        expect(screen.getByText('Update Player')).toBeInTheDocument()
      })

      // Form should be populated with player data
      const nameInput = screen.getByPlaceholderText(/enter player name/i)
      expect(nameInput).toHaveValue('John Doe')
    })

    it('should allow updating a player and refreshing sidebar', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockUpdatePlayer.mockResolvedValue({
        id: 'player1',
        name: 'John Updated',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg'
      })

      // After update, return updated players list
      const updatedPlayers = [...mockPlayers]
      updatedPlayers[0] = { ...mockPlayers[0], name: 'John Updated' }

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select player
      const playerItem = screen.getByText('John Doe').closest('div')
      await user.click(playerItem)

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByText('Update Player')).toBeInTheDocument()
      })

      // Update name
      const nameInput = screen.getByPlaceholderText(/enter player name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'John Updated')

      // Mock the updated fetch
      mockFetchPlayers.mockResolvedValue(updatedPlayers)

      // Submit update
      const submitButton = screen.getByRole('button', { name: /^update player$/i })
      await user.click(submitButton)

      // Verify update was called
      await waitFor(() => {
        expect(mockUpdatePlayer).toHaveBeenCalled()
      })
    })

    it('should cancel edit mode and return to add mode', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select player
      const playerItem = screen.getByText('John Doe').closest('div')
      await user.click(playerItem)

      // Wait for update mode
      await waitFor(() => {
        expect(screen.getByText('Update Player')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should return to add mode
      await waitFor(() => {
        expect(screen.getByText('Add New Player')).toBeInTheDocument()
      })

      // Form should be cleared
      const nameInput = screen.getByPlaceholderText(/enter player name/i)
      expect(nameInput).toHaveValue('')
    })
  })

  describe('Player Deactivation Workflow', () => {
    const mockPlayers = [
      {
        id: 'player1',
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg',
        status: 'active'
      }
    ]

    it('should deactivate a player and update sidebar', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeactivatePlayer.mockResolvedValue({ id: 'player1', status: 'inactive' })

      // After deactivation, return updated list
      const deactivatedPlayers = [{ ...mockPlayers[0], status: 'inactive' }]

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click deactivate button
      const deactivateButton = screen.getByLabelText('Deactivate John Doe')
      await user.click(deactivateButton)

      // Confirm deactivation
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^deactivate$/i })).toBeInTheDocument()
      })

      mockFetchPlayers.mockResolvedValue(deactivatedPlayers)

      const confirmButton = screen.getByRole('button', { name: /^deactivate$/i })
      await user.click(confirmButton)

      // Verify deactivate was called
      await waitFor(() => {
        expect(mockDeactivatePlayer).toHaveBeenCalledWith('player1')
      })
    })
  })

  describe('Player Deletion Workflow', () => {
    const mockPlayers = [
      {
        id: 'player1',
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg',
        status: 'active'
      },
      {
        id: 'player2',
        name: 'Jane Smith',
        originalPhotoUrl: 'https://storage.example.com/player2.jpg',
        status: 'active'
      }
    ]

    it('should delete a player and update sidebar', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeletePlayer.mockResolvedValue({ success: true, id: 'player1' })

      // After deletion, return updated list
      const remainingPlayers = [mockPlayers[1]]

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByLabelText('Delete John Doe')
      await user.click(deleteButton)

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
      })

      mockFetchPlayers.mockResolvedValue(remainingPlayers)

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      // Verify delete was called
      await waitFor(() => {
        expect(mockDeletePlayer).toHaveBeenCalledWith({
          playerId: 'player1',
          imageUrl: 'https://storage.example.com/player1.jpg'
        })
      })
    })

    it('should clear form when deleting selected player', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeletePlayer.mockResolvedValue({ success: true, id: 'player1' })

      const remainingPlayers = [mockPlayers[1]]

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select player
      const playerItem = screen.getByText('John Doe').closest('div')
      await user.click(playerItem)

      // Wait for update mode
      await waitFor(() => {
        expect(screen.getByText('Update Player')).toBeInTheDocument()
      })

      // Delete the selected player
      const deleteButton = screen.getByLabelText('Delete John Doe')
      await user.click(deleteButton)

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
      })

      mockFetchPlayers.mockResolvedValue(remainingPlayers)

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      // Form should return to add mode
      await waitFor(() => {
        expect(screen.getByText('Add New Player')).toBeInTheDocument()
      })
    })
  })

  describe('State Coordination', () => {
    const mockPlayers = [
      {
        id: 'player1',
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg',
        status: 'active'
      },
      {
        id: 'player2',
        name: 'Jane Smith',
        originalPhotoUrl: 'https://storage.example.com/player2.jpg',
        status: 'active'
      }
    ]

    it('should switch between different players in edit mode', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select first player
      const player1Item = screen.getByText('John Doe').closest('div')
      await user.click(player1Item)

      // Verify first player data loaded
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/enter player name/i)
        expect(nameInput).toHaveValue('John Doe')
      })

      // Select second player
      const player2Item = screen.getByText('Jane Smith').closest('div')
      await user.click(player2Item)

      // Verify second player data loaded
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/enter player name/i)
        expect(nameInput).toHaveValue('Jane Smith')
      })
    })

    it('should highlight selected player in sidebar', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderApp()

      // Wait for players to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select player
      const playerItem = screen.getByText('John Doe').closest('div').closest('div')
      await user.click(playerItem)

      // Player should be highlighted
      await waitFor(() => {
        expect(playerItem).toHaveClass('border-primary')
      }, { timeout: 3000 })
    })
  })
})
