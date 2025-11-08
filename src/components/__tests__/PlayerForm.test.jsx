import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerForm } from '../PlayerForm'

// Mock the player service
vi.mock('../../services/playerService', () => ({
  createPlayer: vi.fn(() => Promise.resolve({ id: '123', name: 'Test Player', status: 'processing' }))
}))

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderPlayerForm = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <PlayerForm />
    </QueryClientProvider>
  )
}

describe('PlayerForm', () => {
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

  it('should clear preview when Remove button is clicked', async () => {
    const user = userEvent.setup()
    renderPlayerForm()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByAltText(/preview of test.jpg/i)).toBeInTheDocument()
    })

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByAltText(/preview of test.jpg/i)).not.toBeInTheDocument()
    })
  })

  it('should show validation error for invalid files', async () => {
    const user = userEvent.setup()
    renderPlayerForm()

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]')

    await user.upload(fileInput, largeFile)

    // Check that error message element is present
    await waitFor(() => {
      const errorMessage = document.querySelector('#playerImage-error')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage.textContent.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
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
