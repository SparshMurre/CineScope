import { useState, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './components/HomePage.jsx'
import MovieDetails from './components/MovieDetails.jsx'
import Footer from './components/Footer.jsx'
import { MOCK_MOVIES } from './data/mockMovies.js'
import { searchMovies, isApiKeyConfigured } from './services/omdbApi.js'
import './App.css'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [sortBy, setSortBy] = useState('featured')
  const [activeNav, setActiveNav] = useState('discover')

  // Pre-seed initial favorites
  const [favoriteIds, setFavoriteIds] = useState([1, 5])

  // Cache to preserve full movie metadata for any favorited titles (mock or OMDb)
  const [favoritesCache, setFavoritesCache] = useState(() => {
    const map = {}
    MOCK_MOVIES.forEach((movie) => {
      map[movie.id] = movie
    })
    return map
  })

  // OMDb API state
  const [apiMovies, setApiMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Clear or update search query with immediate reset of API state on empty input
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setApiMovies([])
      setApiError(null)
      setIsLoading(false)
    }
  }

  // Debounced search with AbortController for stale-request guard
  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    // When query is empty or API key is not configured, do not fetch from OMDb
    if (!trimmedQuery || !isApiKeyConfigured()) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setApiError(null)

      try {
        const result = await searchMovies(trimmedQuery, {
          signal: controller.signal,
        })

        if (result.success) {
          setApiMovies(result.movies)
          setApiError(null)
        } else {
          setApiMovies([])
          // If "Movie not found!", keep apiError null so standard empty state renders cleanly
          if (!result.isNotFound) {
            setApiError({
              type: 'api',
              message: result.error || 'OMDb request failed.',
            })
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return // User typed again; ignore canceled request
        }
        setApiMovies([])
        setApiError({
          type: 'network',
          message:
            err.message || 'Network error occurred while fetching from OMDb.',
        })
      } finally {
        setIsLoading(false)
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  // Toggle favorite movie ID and cache movie object
  const handleToggleFavorite = (id, movieObj) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    )

    if (movieObj) {
      setFavoritesCache((prev) => ({
        ...prev,
        [id]: movieObj,
      }))
    }
  }

  // Handle nav tab switching
  const handleNavChange = (navKey) => {
    setActiveNav(navKey)
    if (navKey === 'top-rated') {
      setSortBy('rating-desc')
    }
    // Return to homepage if on a detail or alternative route
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  // Reset search and filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedGenre('All')
    setSortBy(activeNav === 'top-rated' ? 'rating-desc' : 'featured')
    setApiMovies([])
    setApiError(null)
    setIsLoading(false)
  }

  // Smooth scroll to exploration section
  const handleExploreClick = () => {
    const el = document.getElementById('explore-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Featured hero movie (Dune: Part Two by default)
  const featuredMovie = useMemo(
    () => MOCK_MOVIES.find((m) => m.featured) || MOCK_MOVIES[0],
    []
  )

  // Derived indicator: whether API key configuration notice should be shown
  const isConfigNotice = !isApiKeyConfigured() && searchQuery.trim() !== ''

  // Determine movies to display based on navigation, search mode, filters, and sorting
  const filteredMovies = useMemo(() => {
    let result

    // 1. Determine base source dataset
    if (activeNav === 'favorites') {
      result = favoriteIds
        .map((id) => favoritesCache[id] || MOCK_MOVIES.find((m) => m.id === id))
        .filter(Boolean)
    } else if (searchQuery.trim() !== '' && isApiKeyConfigured()) {
      // Live OMDb search results
      result = [...apiMovies]
    } else {
      // Default curated mock movies
      result = [...MOCK_MOVIES]

      if (activeNav === 'top-rated') {
        result = result.filter((movie) => movie.rating >= 8.5)
      }

      // If user typed a search query but API key is missing, filter mock data locally
      const query = searchQuery.trim().toLowerCase()
      if (query) {
        result = result.filter(
          (movie) =>
            movie.title.toLowerCase().includes(query) ||
            movie.genres.some((g) => g.toLowerCase().includes(query)) ||
            movie.overview.toLowerCase().includes(query)
        )
      }
    }

    // 2. Genre filter
    if (selectedGenre !== 'All') {
      result = result.filter(
        (movie) => Array.isArray(movie.genres) && movie.genres.includes(selectedGenre)
      )
    }

    // 3. Sorting
    switch (sortBy) {
      case 'rating-desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'year-desc':
        result.sort(
          (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0)
        )
        break
      case 'year-asc':
        result.sort(
          (a, b) => (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0)
        )
        break
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'featured':
      default:
        // Keep natural search / curated ranking
        break
    }

    return result
  }, [
    activeNav,
    searchQuery,
    apiMovies,
    favoriteIds,
    favoritesCache,
    selectedGenre,
    sortBy,
  ])

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedGenre !== 'All' ||
    (activeNav === 'discover' && sortBy !== 'featured')

  // When on details page, we don't display active tab highlight so it doesn't mislead user
  const effectiveActiveNav = location.pathname === '/' ? activeNav : null

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        activeNav={effectiveActiveNav}
        onNavChange={handleNavChange}
        favoritesCount={favoriteIds.length}
      />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                activeNav={activeNav}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                selectedGenre={selectedGenre}
                onGenreSelect={setSelectedGenre}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalResults={filteredMovies.length}
                isFiltered={isFiltered}
                onResetFilters={handleResetFilters}
                featuredMovie={featuredMovie}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onExploreClick={handleExploreClick}
                isConfigNotice={isConfigNotice}
                filteredMovies={filteredMovies}
                isLoading={isLoading}
                apiError={apiError}
                onDiscoverClick={() => handleNavChange('discover')}
              />
            }
          />
          <Route
            path="/movie/:imdbID"
            element={
              <MovieDetails
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                favoritesCache={favoritesCache}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer onNavChange={handleNavChange} />
    </div>
  )
}
