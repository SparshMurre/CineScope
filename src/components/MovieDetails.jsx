import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMovieDetails, isApiKeyConfigured } from '../services/omdbApi.js'
import { MOCK_MOVIES } from '../data/mockMovies.js'

export default function MovieDetails({
  favoriteIds = [],
  onToggleFavorite,
  favoritesCache = {},
}) {
  const { imdbID } = useParams()
  const trimmedId = imdbID ? imdbID.trim() : ''
  const isNumericId = /^\d+$/.test(trimmedId)

  // Track image error states per movie ID without effect-based resets
  const [posterErrorId, setPosterErrorId] = useState(null)
  const [backdropErrorId, setBackdropErrorId] = useState(null)

  // Synchronously resolve local mock movies or cached titles
  const localMockMovie = useMemo(() => {
    if (!trimmedId) return null
    if (isNumericId) {
      const numericId = parseInt(trimmedId, 10)
      const found =
        MOCK_MOVIES.find((m) => m.id === numericId) || favoritesCache[numericId]
      if (found) {
        return {
          id: found.id,
          imdbID: found.imdbID || String(found.id),
          title: found.title || 'Untitled Movie',
          year: found.year || 'N/A',
          rating: typeof found.rating === 'number' ? found.rating : 0,
          genres:
            Array.isArray(found.genres) && found.genres.length > 0
              ? found.genres
              : ['Movie'],
          duration: found.duration || 'N/A',
          overview:
            found.overview || 'No plot synopsis available for this title.',
          posterUrl: found.posterUrl || null,
          backdropUrl: found.backdropUrl || found.posterUrl || null,
          director: found.director || null,
          actors: found.actors || null,
          rated: found.rated || null,
          imdbVotes: found.imdbVotes || null,
          boxOffice: found.boxOffice || null,
        }
      }
      return null
    }

    if (favoritesCache[trimmedId]) {
      return favoritesCache[trimmedId]
    }

    return null
  }, [trimmedId, isNumericId, favoritesCache])

  // State to hold async OMDb API response
  const [apiState, setApiState] = useState({
    forId: null,
    movie: null,
    error: null,
  })

  // Scroll to top when movie ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [trimmedId])

  // Only initiate OMDb fetch for valid, external alphanumeric IDs with configured API key
  const shouldFetchFromApi = Boolean(
    trimmedId && !isNumericId && isApiKeyConfigured()
  )

  useEffect(() => {
    if (!shouldFetchFromApi) return

    const controller = new AbortController()

    getMovieDetails(trimmedId, { signal: controller.signal })
      .then((result) => {
        if (result.success && result.movie) {
          setApiState({
            forId: trimmedId,
            movie: result.movie,
            error: null,
          })
        } else {
          setApiState({
            forId: trimmedId,
            movie: null,
            error:
              result.error || `Could not find details for title "${trimmedId}".`,
          })
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setApiState({
          forId: trimmedId,
          movie: null,
          error:
            err.message ||
            'Network error occurred while fetching movie details.',
        })
      })

    return () => {
      controller.abort()
    }
  }, [trimmedId, shouldFetchFromApi])

  // Derived movie, loading, and error states
  let movie = null
  let isLoading = false
  let error = null

  if (!trimmedId) {
    error = 'Movie identifier is missing in the URL.'
  } else if (isNumericId) {
    // Numeric mock movie: resolved synchronously
    if (localMockMovie) {
      movie = localMockMovie
    } else {
      error = `Movie #${trimmedId} could not be found in CineScope's catalogue.`
    }
  } else if (!isApiKeyConfigured()) {
    // External ID without API key
    if (localMockMovie) {
      movie = localMockMovie
    } else {
      error =
        'OMDb API key is not configured in VITE_OMDB_API_KEY. Add your key to .env.local to view full details for external titles.'
    }
  } else {
    // External ID with configured API key
    if (apiState.forId === trimmedId) {
      movie = apiState.movie
      error = apiState.error
    } else {
      isLoading = true
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <section
        className="details-state-wrapper"
        aria-label="Loading movie details"
        aria-busy="true"
      >
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="loading-text">Loading movie details&hellip;</p>
        </div>
      </section>
    )
  }

  // Error State
  if (error || !movie) {
    return (
      <section className="details-state-wrapper" aria-label="Movie error">
        <div className="empty-state error-state" role="alert">
          <div className="empty-state-icon-wrapper error-icon-wrapper">
            <svg
              className="empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="empty-state-title">Unable to Display Movie</h1>
          <p className="empty-state-desc">
            {error || 'An unexpected issue occurred while loading this title.'}
          </p>

          <div className="empty-state-actions">
            <Link to="/" className="btn btn-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="btn-icon"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Movies
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const isFavorite = favoriteIds.includes(movie.id)
  const genresList = Array.isArray(movie.genres) ? movie.genres : []
  const hasPosterError = posterErrorId === movie.id
  const hasBackdropError = backdropErrorId === movie.id

  return (
    <article className="movie-details-page" aria-label={`${movie.title} Details`}>
      {/* Top Breadcrumb / Back Navigation Bar */}
      <div className="details-nav-bar">
        <Link to="/" className="btn btn-outline details-back-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="btn-icon"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Movies
        </Link>
      </div>

      {/* Hero Backdrop Presentation */}
      <div className="details-hero">
        <div className="details-backdrop-wrapper">
          {!hasBackdropError && (movie.backdropUrl || movie.posterUrl) ? (
            <img
              src={movie.backdropUrl || movie.posterUrl}
              alt=""
              className="details-backdrop-img"
              onError={() => setBackdropErrorId(movie.id)}
            />
          ) : (
            <div className="details-backdrop-fallback" aria-hidden="true" />
          )}
          <div className="details-gradient-overlay" />
        </div>

        {/* Foreground Content Layout: Poster + Metadata */}
        <div className="details-content-grid">
          {/* Poster Column */}
          <div className="details-poster-col">
            <div className="details-poster-wrapper">
              {!hasPosterError && movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} official poster`}
                  className="details-poster-img"
                  onError={() => setPosterErrorId(movie.id)}
                />
              ) : (
                <div className="details-poster-fallback" aria-label="Poster not available">
                  <svg
                    className="details-fallback-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="details-fallback-text">{movie.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Column */}
          <div className="details-info-col">
            {/* Meta Row: Rating, Year, Runtime, Content Rating */}
            <div className="details-meta-row">
              <span
                className="details-rating-badge"
                aria-label={
                  movie.rating && movie.rating > 0
                    ? `IMDb Rating: ${movie.rating} out of 10`
                    : 'Not rated yet'
                }
              >
                <svg
                  className="star-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <strong>
                  {movie.rating && movie.rating > 0 ? movie.rating.toFixed(1) : 'NR'}
                </strong>
                <span className="details-rating-scale">/ 10</span>
              </span>

              <span className="details-meta-pill">{movie.year || 'N/A'}</span>
              <span className="details-meta-pill">{movie.duration || 'N/A'}</span>

              {movie.rated && (
                <span className="details-meta-pill details-pill-rated">
                  {movie.rated}
                </span>
              )}

              {movie.imdbVotes && (
                <span className="details-votes-text">
                  {movie.imdbVotes} votes
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="details-title">{movie.title}</h1>

            {/* Genres */}
            {genresList.length > 0 && (
              <div className="details-genres-list" aria-label="Movie genres">
                {genresList.map((genre) => (
                  <span key={genre} className="details-genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Actions: Favorite Button */}
            <div className="details-actions-bar">
              <button
                type="button"
                className={`btn ${
                  isFavorite ? 'btn-favorited' : 'btn-secondary'
                } details-fav-action-btn`}
                onClick={() => onToggleFavorite(movie.id, movie)}
                aria-label={
                  isFavorite
                    ? `Remove ${movie.title} from favorites`
                    : `Add ${movie.title} to favorites`
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="btn-icon"
                  aria-hidden="true"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
              </button>
            </div>

            {/* Plot / Synopsis */}
            <div className="details-section">
              <h2 className="details-section-heading">Overview</h2>
              <p className="details-plot-text">{movie.overview}</p>
            </div>

            {/* Cast & Crew Data */}
            <div className="details-crew-card">
              <div className="details-crew-row">
                <span className="details-crew-label">Director</span>
                <span className="details-crew-val">{movie.director || 'N/A'}</span>
              </div>

              <div className="details-crew-row">
                <span className="details-crew-label">Starring</span>
                <span className="details-crew-val">{movie.actors || 'N/A'}</span>
              </div>

              {movie.boxOffice && (
                <div className="details-crew-row">
                  <span className="details-crew-label">Box Office</span>
                  <span className="details-crew-val">{movie.boxOffice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
