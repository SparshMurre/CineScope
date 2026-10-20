import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MovieDetails from '../components/MovieDetails.jsx'
import App from '../App.jsx'

describe('MovieDetails Routing & Data Presentation', () => {
  it('renders mock movie details for numeric ID 1 with metadata and back button', () => {
    render(
      <MemoryRouter initialEntries={['/movie/1']}>
        <Routes>
          <Route
            path="/movie/:imdbID"
            element={
              <MovieDetails
                favoriteIds={[1]}
                onToggleFavorite={vi.fn()}
                favoritesCache={{}}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Title & Metadata
    expect(screen.getByRole('heading', { level: 1, name: 'Dune: Part Two' })).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('2h 46m')).toBeInTheDocument()
    expect(screen.getByText('8.6')).toBeInTheDocument()
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument()

    // Back button
    expect(screen.getByRole('link', { name: /Back to Movies/i })).toHaveAttribute('href', '/')

    // Synced favorite button
    expect(screen.getByRole('button', { name: /Remove Dune: Part Two from favorites/i })).toHaveClass('btn-favorited')
  })

  it('renders graceful error state when numeric mock ID does not exist', () => {
    render(
      <MemoryRouter initialEntries={['/movie/999']}>
        <Routes>
          <Route
            path="/movie/:imdbID"
            element={
              <MovieDetails
                favoriteIds={[]}
                onToggleFavorite={vi.fn()}
                favoritesCache={{}}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Unable to Display Movie/i })).toBeInTheDocument()
    expect(screen.getByText(/Movie #999 could not be found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Movies/i })).toBeInTheDocument()
  })

  it('toggles favorite status from details page action button', async () => {
    const user = userEvent.setup()
    const handleToggleFavorite = vi.fn()

    render(
      <MemoryRouter initialEntries={['/movie/1']}>
        <Routes>
          <Route
            path="/movie/:imdbID"
            element={
              <MovieDetails
                favoriteIds={[]}
                onToggleFavorite={handleToggleFavorite}
                favoritesCache={{}}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    const favButton = screen.getByRole('button', { name: /Add Dune: Part Two to favorites/i })
    await user.click(favButton)
    expect(handleToggleFavorite).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Dune: Part Two' }))
  })

  it('renders homepage at / with hero spotlight and navigation bar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('region', { name: /Featured Movie Spotlight/i })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /Search movies/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discover' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /AI Match/i }).length).toBeGreaterThanOrEqual(1)
  })
})
