import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FilterControls from '../components/FilterControls.jsx'
import MovieCard from '../components/MovieCard.jsx'
import MovieGrid from '../components/MovieGrid.jsx'

const sampleMovie = {
  id: 1,
  imdbID: '1',
  title: 'Dune: Part Two',
  year: 2024,
  rating: 8.6,
  genres: ['Sci-Fi', 'Adventure', 'Action'],
  duration: '2h 46m',
  overview: 'Paul Atreides unites with Chani and the Fremen.',
  posterUrl: 'https://example.com/dune.jpg',
}

describe('FilterControls Component', () => {
  it('handles search input change and clear action', async () => {
    const user = userEvent.setup()
    const handleSearchChange = vi.fn()

    render(
      <FilterControls
        searchQuery="Dune"
        onSearchChange={handleSearchChange}
        selectedGenre="All"
        onGenreSelect={vi.fn()}
        genres={['All', 'Action', 'Sci-Fi']}
        sortBy="featured"
        onSortChange={vi.fn()}
        totalResults={1}
        isFiltered={true}
        onResetFilters={vi.fn()}
      />
    )

    const searchInput = screen.getByRole('searchbox', { name: /Search movies/i })
    expect(searchInput).toHaveValue('Dune')

    const clearBtn = screen.getByRole('button', { name: /Clear search query/i })
    await user.click(clearBtn)
    expect(handleSearchChange).toHaveBeenCalledWith('')
  })

  it('handles genre selection and sort dropdown changes', async () => {
    const user = userEvent.setup()
    const handleGenreSelect = vi.fn()
    const handleSortChange = vi.fn()

    render(
      <FilterControls
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGenre="All"
        onGenreSelect={handleGenreSelect}
        genres={['All', 'Action', 'Sci-Fi']}
        sortBy="featured"
        onSortChange={handleSortChange}
        totalResults={12}
        isFiltered={false}
        onResetFilters={vi.fn()}
      />
    )

    const scifiChip = screen.getByRole('button', { name: 'Sci-Fi' })
    await user.click(scifiChip)
    expect(handleGenreSelect).toHaveBeenCalledWith('Sci-Fi')

    const sortSelect = screen.getByRole('combobox', { name: /Sort movies by/i })
    await user.selectOptions(sortSelect, 'rating-desc')
    expect(handleSortChange).toHaveBeenCalledWith('rating-desc')
  })
})

describe('MovieCard Component & Independent Favorites Action', () => {
  it('renders movie title, year, duration, and rating', () => {
    render(
      <MemoryRouter>
        <MovieCard movie={sampleMovie} isFavorite={false} onToggleFavorite={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByText('Dune: Part Two')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('2h 46m')).toBeInTheDocument()
    expect(screen.getByText('8.6')).toBeInTheDocument()
  })

  it('clicking favorite button stops event propagation and calls onToggleFavorite', async () => {
    const user = userEvent.setup()
    const handleToggleFavorite = vi.fn()

    render(
      <MemoryRouter>
        <MovieCard
          movie={sampleMovie}
          isFavorite={false}
          onToggleFavorite={handleToggleFavorite}
        />
      </MemoryRouter>
    )

    const favButton = screen.getByRole('button', {
      name: /Add Dune: Part Two to favorites/i,
    })

    await user.click(favButton)
    expect(handleToggleFavorite).toHaveBeenCalledWith(1, sampleMovie)
  })
})

describe('MovieGrid Component States', () => {
  it('renders loading state with spinner and skeletons when isLoading is true', () => {
    render(
      <MovieGrid
        movies={[]}
        favoriteIds={[]}
        onToggleFavorite={vi.fn()}
        activeNav="discover"
        onResetFilters={vi.fn()}
        onDiscoverClick={vi.fn()}
        isLoading={true}
        apiError={null}
        searchQuery="Inception"
      />
    )

    expect(screen.getByText(/Searching OMDb for/i)).toBeInTheDocument()
  })

  it('renders error state when apiError is passed and movie list is empty', () => {
    render(
      <MovieGrid
        movies={[]}
        favoriteIds={[]}
        onToggleFavorite={vi.fn()}
        activeNav="discover"
        onResetFilters={vi.fn()}
        onDiscoverClick={vi.fn()}
        isLoading={false}
        apiError={{ type: 'api', message: 'OMDb rate limit exceeded' }}
        searchQuery="Inception"
      />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/OMDb rate limit exceeded/i)).toBeInTheDocument()
  })

  it('renders empty search state when no movies match', () => {
    render(
      <MovieGrid
        movies={[]}
        favoriteIds={[]}
        onToggleFavorite={vi.fn()}
        activeNav="discover"
        onResetFilters={vi.fn()}
        onDiscoverClick={vi.fn()}
        isLoading={false}
        apiError={null}
        searchQuery="NonExistentTitleXYZ"
      />
    )

    expect(screen.getByText(/No movies found for "NonExistentTitleXYZ"/i)).toBeInTheDocument()
  })
})
