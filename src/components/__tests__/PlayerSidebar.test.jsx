import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerSidebar } from '../PlayerSidebar'

// Mock the player service
const mockFetchPlayers = vi.fn()
const mockDeactivatePlayer = vi.fn()
const mockDeletePlayer = vi.fn()

vi.mock('../../services/playerService', () => ({
  fetchPlayers: () => mockFetchPlayers(),
  deactivatePlayer: (playerId) => mockDeactivatePlayer(playerId),
  deletePlayer: (data) => mockDeletePlayer(data),
}))

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderPlayerSidebar = (props = {}) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <PlayerSidebar {...props} />
    </QueryClientProvider>
  )
}

describe('PlayerSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching players', () => {
      mockFetchPlayers.mockImplementation(() => new Promise(() => {}))
      renderPlayerSidebar()

      expect(screen.getByText('Loading players...')).toBeInTheDocument()
    })

    it('should show error state when fetch fails', async () => {
      mockFetchPlayers.mockRejectedValue(new Error('Network error'))
      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText(/failed to load players/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no players exist', async () => {
      mockFetchPlayers.mockResolvedValue([])
      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText(/no players yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Players List', () => {
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
        status: 'inactive'
      }
    ]

    it('should render list of players', async () => {
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should show inactive badge for inactive players', async () => {
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })

    it('should call onSelectPlayer when player is clicked', async () => {
      const user = userEvent.setup()
      const onSelectPlayer = vi.fn()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderPlayerSidebar({ onSelectPlayer })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const playerItem = screen.getByText('John Doe').closest('div')
      await user.click(playerItem)

      expect(onSelectPlayer).toHaveBeenCalledWith(mockPlayers[0])
    })

    it('should highlight selected player', async () => {
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      renderPlayerSidebar({ selectedPlayerId: 'player1' })

      await waitFor(() => {
        const playerItem = screen.getByText('John Doe').closest('div')
        expect(playerItem).toHaveClass('border-primary')
      })
    })
  })

  describe('Deactivate and Delete Actions', () => {
    const mockPlayers = [
      {
        id: 'player1',
        name: 'John Doe',
        originalPhotoUrl: 'https://storage.example.com/player1.jpg',
        status: 'active'
      }
    ]

    it('should show deactivate confirmation dialog', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deactivateButton = screen.getByLabelText('Deactivate John Doe')
      await user.click(deactivateButton)

      await waitFor(() => {
        expect(screen.getByText(/deactivate john doe/i)).toBeInTheDocument()
      })
    })

    it('should trigger deactivate mutation on confirm', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeactivatePlayer.mockResolvedValue({ id: 'player1', status: 'inactive' })

      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deactivateButton = screen.getByLabelText('Deactivate John Doe')
      await user.click(deactivateButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^deactivate$/i })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^deactivate$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeactivatePlayer).toHaveBeenCalledWith('player1')
      })
    })

    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)

      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('Delete John Doe')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/permanently delete john doe/i)).toBeInTheDocument()
      })
    })

    it('should trigger delete mutation on confirm', async () => {
      const user = userEvent.setup()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeletePlayer.mockResolvedValue({ success: true, id: 'player1' })

      renderPlayerSidebar()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('Delete John Doe')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeletePlayer).toHaveBeenCalledWith({
          playerId: 'player1',
          imageUrl: 'https://storage.example.com/player1.jpg'
        })
      })
    })

    it('should call onPlayerDeleted when selected player is deleted', async () => {
      const user = userEvent.setup()
      const onPlayerDeleted = vi.fn()
      mockFetchPlayers.mockResolvedValue(mockPlayers)
      mockDeletePlayer.mockResolvedValue({ success: true, id: 'player1' })

      renderPlayerSidebar({ selectedPlayerId: 'player1', onPlayerDeleted })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('Delete John Doe')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(onPlayerDeleted).toHaveBeenCalled()
      })
    })
  })
})
