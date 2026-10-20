import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '../components/Navbar.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import HomePage from '../components/HomePage.jsx'
import Footer from '../components/Footer.jsx'

const sampleHeroMovie = {
  id: 1,
  title: 'Dune: Part Two',
  year: 2024,
  rating: 8.6,
  genres: ['Sci-Fi', 'Adventure'],
  duration: '2h 46m',
  overview: 'Paul Atreides unites with Chani and the Fremen.',
  posterUrl: 'https://example.com/dune.jpg',
  backdropUrl: 'https://example.com/dune-backdrop.jpg',
}

describe('Navbar Component Navigation & Mobile Drawer', () => {
  it('triggers onNavChange when clicking navigation tabs and brand logo', async () => {
    const user = userEvent.setup()
    const handleNavChange = vi.fn()

    render(
      <Navbar
        activeNav="discover"
        onNavChange={handleNavChange}
        favoritesCount={3}
      />
    )

    // Brand logo
    await user.click(screen.getByRole('button', { name: /CineScope Home/i }))
    expect(handleNavChange).toHaveBeenCalledWith('discover')

    // Top rated tab
    await user.click(screen.getByRole('button', { name: 'Top Rated' }))
    expect(handleNavChange).toHaveBeenCalledWith('top-rated')

    // AI Match tab
    await user.click(screen.getByRole('button', { name: /AI Match/i }))
    expect(handleNavChange).toHaveBeenCalledWith('ai-recs')

    // Favorites tab
    await user.click(screen.getByRole('button', { name: /3 favorites/i }))
    expect(handleNavChange).toHaveBeenCalledWith('favorites')
  })

  it('toggles mobile menu drawer state when clicking hamburger toggle', async () => {
    const user = userEvent.setup()

    render(
      <Navbar
        activeNav="discover"
        onNavChange={vi.fn()}
        favoritesCount={0}
      />
    )

    const toggleBtn = screen.getByRole('button', { name: /Open navigation menu/i })
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('HeroBanner Component Interactions', () => {
  it('shows trailer notice message when clicking Watch Trailer button', async () => {
    const user = userEvent.setup()

    render(
      <HeroBanner
        movie={sampleHeroMovie}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        onExploreClick={vi.fn()}
      />
    )

    const trailerBtn = screen.getByRole('button', { name: /Watch Trailer/i })
    await user.click(trailerBtn)

    expect(
      screen.getByText(/Trailer streaming will be available in the upcoming API integration release!/i)
    ).toBeInTheDocument()
  })

  it('triggers onExploreClick and onToggleFavorite actions', async () => {
    const user = userEvent.setup()
    const handleExploreClick = vi.fn()
    const handleToggleFavorite = vi.fn()

    render(
      <HeroBanner
        movie={sampleHeroMovie}
        isFavorite={false}
        onToggleFavorite={handleToggleFavorite}
        onExploreClick={handleExploreClick}
      />
    )

    // Explore button
    await user.click(screen.getByRole('button', { name: /Explore Library ↓/i }))
    expect(handleExploreClick).toHaveBeenCalled()

    // Favorite toggle button
    await user.click(screen.getByRole('button', { name: /Add Dune: Part Two to favorites/i }))
    expect(handleToggleFavorite).toHaveBeenCalledWith(1, sampleHeroMovie)
  })
})

describe('HomePage Component Dedicated Views & Banners', () => {
  it('renders favorites header banner when activeNav is favorites', () => {
    render(
      <HomePage
        activeNav="favorites"
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGenre="All"
        onGenreSelect={vi.fn()}
        sortBy="featured"
        onSortChange={vi.fn()}
        totalResults={2}
        isFiltered={false}
        onResetFilters={vi.fn()}
        featuredMovie={sampleHeroMovie}
        favoriteIds={[1, 2]}
        onToggleFavorite={vi.fn()}
        onExploreClick={vi.fn()}
        isConfigNotice={false}
        filteredMovies={[]}
        isLoading={false}
        apiError={null}
        onDiscoverClick={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /Your Watchlist & Favorites/i })).toBeInTheDocument()
    expect(screen.getByText(/You have curated 2 films/i)).toBeInTheDocument()
  })

  it('renders config notice banner when isConfigNotice is true', () => {
    render(
      <HomePage
        activeNav="discover"
        searchQuery="batman"
        onSearchChange={vi.fn()}
        selectedGenre="All"
        onGenreSelect={vi.fn()}
        sortBy="featured"
        onSortChange={vi.fn()}
        totalResults={1}
        isFiltered={true}
        onResetFilters={vi.fn()}
        featuredMovie={sampleHeroMovie}
        favoriteIds={[]}
        onToggleFavorite={vi.fn()}
        onExploreClick={vi.fn()}
        isConfigNotice={true}
        filteredMovies={[]}
        isLoading={false}
        apiError={null}
        onDiscoverClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Local Mock Fallback Active:/i)).toBeInTheDocument()
  })

  it('clicking AI teaser banner invokes onNavChange to ai-recs', async () => {
    const user = userEvent.setup()
    const handleNavChange = vi.fn()

    render(
      <HomePage
        activeNav="discover"
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGenre="All"
        onGenreSelect={vi.fn()}
        sortBy="featured"
        onSortChange={vi.fn()}
        totalResults={12}
        isFiltered={false}
        onResetFilters={vi.fn()}
        featuredMovie={sampleHeroMovie}
        favoriteIds={[]}
        onToggleFavorite={vi.fn()}
        onExploreClick={vi.fn()}
        isConfigNotice={false}
        filteredMovies={[]}
        isLoading={false}
        apiError={null}
        onDiscoverClick={vi.fn()}
        onNavChange={handleNavChange}
      />
    )

    const teaser = screen.getByRole('button', { name: /Open AI Movie Matcher/i })
    await user.click(teaser)
    expect(handleNavChange).toHaveBeenCalledWith('ai-recs')
  })
})

describe('Footer Component', () => {
  it('triggers onNavChange when clicking footer navigation links', async () => {
    const user = userEvent.setup()
    const handleNavChange = vi.fn()

    render(<Footer onNavChange={handleNavChange} />)

    await user.click(screen.getByRole('button', { name: 'Discover Movies' }))
    expect(handleNavChange).toHaveBeenCalledWith('discover')

    await user.click(screen.getByRole('button', { name: 'Top Rated' }))
    expect(handleNavChange).toHaveBeenCalledWith('top-rated')

    await user.click(screen.getByRole('button', { name: 'AI Match' }))
    expect(handleNavChange).toHaveBeenCalledWith('ai-recs')

    await user.click(screen.getByRole('button', { name: 'Favorites' }))
    expect(handleNavChange).toHaveBeenCalledWith('favorites')
  })
})
