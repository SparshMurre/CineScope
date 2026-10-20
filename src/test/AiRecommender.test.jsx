import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AiRecommender from '../components/AiRecommender.jsx'

describe('AiRecommender Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders initial empty guide view and accessible form elements', () => {
    render(
      <MemoryRouter>
        <AiRecommender favoriteIds={[]} onToggleFavorite={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Describe Your Movie Mood/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /How to Use CineScope AI Recommendations/i })).toBeInTheDocument()

    const textarea = screen.getByLabelText(/describe your movie preference or mood/i)
    expect(textarea).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get Recommendations/i })).toBeDisabled()

    // Example chips present
    expect(screen.getByRole('button', { name: /Mind-bending space exploration/i })).toBeInTheDocument()
  })

  it('updates input and enables submit button when typing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AiRecommender favoriteIds={[]} onToggleFavorite={vi.fn()} />
      </MemoryRouter>
    )

    const textarea = screen.getByLabelText(/describe your movie preference or mood/i)
    await user.type(textarea, 'mind-bending sci-fi with wormholes')

    expect(textarea).toHaveValue('mind-bending sci-fi with wormholes')
    const submitBtn = screen.getByRole('button', { name: /Get Recommendations/i })
    expect(submitBtn).toBeEnabled()

    // Test clear button
    const clearBtn = screen.getByRole('button', { name: /Clear input text/i })
    await user.click(clearBtn)
    expect(textarea).toHaveValue('')
    expect(submitBtn).toBeDisabled()
  })

  it('handles API error state gracefully', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI recommendation service unavailable' }),
    })

    render(
      <MemoryRouter>
        <AiRecommender favoriteIds={[]} onToggleFavorite={vi.fn()} />
      </MemoryRouter>
    )

    const textarea = screen.getByLabelText(/describe your movie preference or mood/i)
    await user.type(textarea, 'dark crime')
    await user.click(screen.getByRole('button', { name: /Get Recommendations/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/AI recommendation service unavailable/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
    })
  })

  it('renders structured recommendations, match reasons, and syncs favorites', async () => {
    const user = userEvent.setup()
    const handleToggleFavorite = vi.fn()

    const mockResponse = {
      success: true,
      isAiPowered: false,
      isFallback: true,
      notice: 'Running in grounded local matching fallback mode.',
      summary: 'Found 1 matching film for your search.',
      recommendations: [
        {
          id: 2,
          imdbID: '2',
          title: 'Interstellar',
          year: 2014,
          rating: 8.7,
          genres: ['Sci-Fi', 'Drama', 'Adventure'],
          duration: '2h 49m',
          overview: 'Mankind looks to the stars to find a new home.',
          posterUrl: 'https://example.com/interstellar.jpg',
          relevanceScore: 98,
          matchReason: 'Directly matches space exploration with a 8.7/10 rating.',
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    render(
      <MemoryRouter>
        <AiRecommender favoriteIds={[2]} onToggleFavorite={handleToggleFavorite} />
      </MemoryRouter>
    )

    const textarea = screen.getByLabelText(/describe your movie preference or mood/i)
    await user.type(textarea, 'epic space exploration')
    await user.click(screen.getByRole('button', { name: /Get Recommendations/i }))

    await waitFor(() => {
      expect(screen.getByText(/Found 1 matching film for your search./i)).toBeInTheDocument()
      expect(screen.getByText('Interstellar')).toBeInTheDocument()
      expect(screen.getByText(/★ 98% Match/i)).toBeInTheDocument()
      expect(screen.getByText(/Directly matches space exploration/i)).toBeInTheDocument()
      expect(screen.getByText(/Running in grounded local matching fallback mode./i)).toBeInTheDocument()
    })

    // Test favorite button on recommended card
    const favBtn = screen.getByRole('button', { name: /Remove Interstellar from favorites/i })
    expect(favBtn).toHaveClass('is-favorited')
    await user.click(favBtn)
    expect(handleToggleFavorite).toHaveBeenCalledWith(2, expect.objectContaining({ title: 'Interstellar' }))
  })
})
