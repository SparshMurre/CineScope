import HeroBanner from './HeroBanner.jsx'
import FilterControls from './FilterControls.jsx'
import MovieGrid from './MovieGrid.jsx'
import AiRecommender from './AiRecommender.jsx'
import { GENRES } from '../data/mockMovies.js'

export default function HomePage({
  activeNav,
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreSelect,
  sortBy,
  onSortChange,
  totalResults,
  isFiltered,
  onResetFilters,
  featuredMovie,
  favoriteIds,
  onToggleFavorite,
  onExploreClick,
  isConfigNotice,
  filteredMovies,
  isLoading,
  apiError,
  onDiscoverClick,
  onNavChange,
}) {
  // Dedicated view for AI Recommendations
  if (activeNav === 'ai-recs') {
    return (
      <AiRecommender
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
      />
    )
  }

  return (
    <>
      {/* Spotlight Hero Banner (shown on discover or top-rated when no active search) */}
      {activeNav !== 'favorites' && !searchQuery.trim() && (
        <HeroBanner
          movie={featuredMovie}
          isFavorite={favoriteIds.includes(featuredMovie?.id)}
          onToggleFavorite={onToggleFavorite}
          onExploreClick={onExploreClick}
        />
      )}

      {/* AI Discovery Teaser Banner on Discover Tab */}
      {activeNav === 'discover' && !searchQuery.trim() && onNavChange && (
        <aside
          className="ai-discovery-teaser"
          onClick={() => onNavChange('ai-recs')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onNavChange('ai-recs')
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Open AI Movie Matcher"
        >
          <div className="teaser-content">
            <span className="teaser-badge">✨ AI Cinema Matcher</span>
            <span className="teaser-text">
              Looking for a specific vibe or mood? Describe it in plain words and get instant grounded recommendations.
            </span>
          </div>
          <span className="teaser-action">Try AI Match &rarr;</span>
        </aside>
      )}

      {/* Dedicated banner when viewing Favorites tab */}
      {activeNav === 'favorites' && (
        <section className="favorites-header" aria-label="Favorites Header">
          <h1 className="favorites-header-title">
            Your Watchlist &amp; Favorites
          </h1>
          <p className="favorites-header-desc">
            You have curated {favoriteIds.length}{' '}
            {favoriteIds.length === 1 ? 'film' : 'films'}. Click the heart on any card to add or remove items.
          </p>
        </section>
      )}

      {/* Search, Filter Chips, and Sorting */}
      <FilterControls
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedGenre={selectedGenre}
        onGenreSelect={onGenreSelect}
        genres={GENRES}
        sortBy={sortBy}
        onSortChange={onSortChange}
        totalResults={totalResults}
        isFiltered={isFiltered}
        onResetFilters={onResetFilters}
      />

      {/* Configuration hint banner when API key is missing during search */}
      {isConfigNotice && (
        <aside className="config-notice-banner" role="status">
          <div className="notice-icon-box">
            <svg
              className="notice-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="notice-content">
            <strong>Local Mock Fallback Active:</strong> OMDb API key not detected in <code>VITE_OMDB_API_KEY</code>. Searching CineScope&apos;s local mock collection. To enable live OMDb searching, add your key to <code>.env.local</code>.
          </div>
        </aside>
      )}

      {/* Movies Grid (with loading, error, and empty states) */}
      <MovieGrid
        movies={filteredMovies}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        activeNav={activeNav}
        onResetFilters={onResetFilters}
        onDiscoverClick={onDiscoverClick}
        isLoading={isLoading}
        apiError={apiError}
        searchQuery={searchQuery.trim()}
      />
    </>
  )
}
