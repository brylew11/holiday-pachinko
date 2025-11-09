import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerDetails } from '../PlayerDetails'

// Mock services
vi.mock('../../services/avatarService', () => ({
  regenerateAvatar: vi.fn()
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('PlayerDetails', () => {
  let queryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const renderComponent = (player) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PlayerDetails player={player} />
      </QueryClientProvider>
    )
  }

  const mockPlayer = {
    id: 'player-123',
    name: 'Test Player',
    originalPhotoUrl: 'https://test.com/original.jpg',
    avatarUrl: 'https://test.com/avatar.jpg',
    generationStatus: 'completed',
    status: 'active'
  }

  test('should trigger regenerateAvatar mutation when Regenerate button is clicked', async () => {
    const { regenerateAvatar } = await import('../../services/avatarService')

    regenerateAvatar.mockResolvedValue({
      success: true,
      avatarUrl: 'https://test.com/new-avatar.jpg'
    })

    renderComponent(mockPlayer)

    const regenerateButton = screen.getByRole('button', { name: /regenerate avatar/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(regenerateAvatar).toHaveBeenCalledWith({
        playerId: 'player-123',
        originalPhotoUrl: 'https://test.com/original.jpg'
      })
    })
  })

  test('should display loading state during avatar regeneration', async () => {
    const { regenerateAvatar } = await import('../../services/avatarService')

    regenerateAvatar.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderComponent(mockPlayer)

    const regenerateButton = screen.getByRole('button', { name: /regenerate avatar/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(screen.getByText(/regenerating/i)).toBeInTheDocument()
    })
  })

  test('should display original photo and generated avatar side-by-side', () => {
    renderComponent(mockPlayer)

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)

    expect(screen.getByAltText(`Original photo of ${mockPlayer.name}`)).toBeInTheDocument()
    expect(screen.getByAltText(`Generated avatar of ${mockPlayer.name}`)).toBeInTheDocument()
  })

  test('should show "generating..." badge when generationStatus is pending', () => {
    const pendingPlayer = {
      ...mockPlayer,
      generationStatus: 'pending',
      avatarUrl: null
    }

    renderComponent(pendingPlayer)

    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  test('should disable Regenerate button when generation is pending', () => {
    const pendingPlayer = {
      ...mockPlayer,
      generationStatus: 'pending'
    }

    renderComponent(pendingPlayer)

    const regenerateButton = screen.getByRole('button', { name: /regenerate avatar/i })
    expect(regenerateButton).toBeDisabled()
  })
})
