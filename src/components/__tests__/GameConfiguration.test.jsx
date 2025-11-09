import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GameConfiguration } from '../GameConfiguration'

// Mock services
vi.mock('../../services/avatarService', () => ({
  fetchAvatarSettings: vi.fn(),
  updateAvatarPrompt: vi.fn()
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('GameConfiguration', () => {
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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GameConfiguration />
      </QueryClientProvider>
    )
  }

  test('should load prompt from Firestore on component mount', async () => {
    const { fetchAvatarSettings } = await import('../../services/avatarService')

    fetchAvatarSettings.mockResolvedValue({
      geminiAvatarPrompt: 'Test prompt from Firestore',
      placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
      enabled: true
    })

    renderComponent()

    await waitFor(() => {
      const textarea = screen.getByRole('textbox')
      expect(textarea.value).toBe('Test prompt from Firestore')
    })
  })

  test('should trigger updateAvatarPrompt mutation when Save button is clicked', async () => {
    const { fetchAvatarSettings, updateAvatarPrompt } = await import('../../services/avatarService')

    fetchAvatarSettings.mockResolvedValue({
      geminiAvatarPrompt: 'Original prompt',
      placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
      enabled: true
    })

    updateAvatarPrompt.mockResolvedValue({
      geminiAvatarPrompt: 'Updated prompt',
      placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
      enabled: true
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('Original prompt')
    })

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Updated prompt' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateAvatarPrompt).toHaveBeenCalledWith({
        geminiAvatarPrompt: 'Updated prompt'
      })
    })
  })

  test('should update character count as user types', async () => {
    const { fetchAvatarSettings } = await import('../../services/avatarService')

    fetchAvatarSettings.mockResolvedValue({
      geminiAvatarPrompt: 'Test',
      placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
      enabled: true
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('Test')
    })

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New prompt with more characters' } })

    expect(screen.getByText(/32 characters/i)).toBeInTheDocument()
  })

  test('should disable Save button when prompt is unchanged', async () => {
    const { fetchAvatarSettings } = await import('../../services/avatarService')

    fetchAvatarSettings.mockResolvedValue({
      geminiAvatarPrompt: 'Original prompt',
      placeholderAvatarUrl: 'https://test.com/placeholder.jpg',
      enabled: true
    })

    renderComponent()

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeDisabled()
    })
  })
})
