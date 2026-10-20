import MovieCard from './MovieCard.jsx'

export default function MovieGrid({
  movies,
  favoriteIds,
  onToggleFavorite,
  activeNav,
  onResetFilters,
  onDiscoverClick,
  isLoading,
  apiError,
  searchQuery,
}) {
  // 1. Loading State
  if (isLoading) {
    return (
      <section className="movie-grid-section" aria-label="Loading movies" aria-busy="true">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="loading-text">
            Searching OMDb for &ldquo;{searchQuery}&rdquo;&hellip;
          </p>
        </div>

        {/* Skeleton Grid for Visual Polish */}
        <div className="movie-grid skeleton-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-poster" />
              <div className="skeleton-info">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // 2. Fatal API / Network Error State (when no movies could be shown)
  if (apiError && movies.length === 0) {
    const isConfigError = apiError.type === 'config'

    return (
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
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>

        <h3 className="empty-state-title">
          {isConfigError ? 'API Key Configuration Required' : 'Unable to Fetch Movies'}
        </h3>

        <p className="empty-state-desc">
          {apiError.message || 'An unexpected error occurred while communicating with OMDb.'}
        </p>

        <div className="empty-state-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResetFilters}
          >
            Reset Filters &amp; Return Home
          </button>
        </div>
      </div>
    )
  }

  // 3. Empty Results State
  if (movies.length === 0) {
    const isFavoritesView = activeNav === 'favorites'

    return (
      <div className="empty-state" role="status">
        <div className="empty-state-icon-wrapper">
          {isFavoritesView ? (
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
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          ) : (
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <line x1="8" x2="14" y1="11" y2="11" />
            </svg>
          )}
        </div>

        <h3 className="empty-state-title">
          {isFavoritesView
            ? 'No favorite movies yet'
            : searchQuery
            ? `No movies found for "${searchQuery}"`
            : 'No matching movies found'}
        </h3>

        <p className="empty-state-desc">
          {isFavoritesView
            ? 'Tap the heart icon on any movie to add it to your curated favorites list.'
            : searchQuery
            ? 'We could not find any titles matching your query on OMDb. Try checking for typos or searching for a different keyword.'
            : 'Try adjusting your genre filter or resetting all search filters.'}
        </p>

        <div className="empty-state-actions">
          {isFavoritesView ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDiscoverClick}
            >
              Discover Movies
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onResetFilters}
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>
    )
  }

  // 4. Populated Movie Catalog Grid
  return (
    <section className="movie-grid-section" aria-label="Movie Catalog">
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isFavorite={favoriteIds.includes(movie.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  )
}
