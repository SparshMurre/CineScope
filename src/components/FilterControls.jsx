export default function FilterControls({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreSelect,
  genres,
  sortBy,
  onSortChange,
  totalResults,
  isFiltered,
  onResetFilters,
}) {
  return (
    <div className="filter-controls" id="explore-section">
      {/* Top Row: Search and Sort */}
      <div className="filter-top-bar">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search movies by title, genre, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search movies"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="sort-wrapper">
          <label htmlFor="movie-sort" className="sort-label">
            Sort by:
          </label>
          <div className="sort-select-wrapper">
            <select
              id="movie-sort"
              className="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort movies by"
            >
              <option value="featured">Featured</option>
              <option value="rating-desc">Highest Rated (★)</option>
              <option value="year-desc">Newest Releases</option>
              <option value="year-asc">Oldest Classics</option>
              <option value="title-asc">Title (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="genre-chips-container" role="region" aria-label="Genre Filters">
        <span className="genre-label">Genres:</span>
        <div className="genre-chips-scroll">
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre
            return (
              <button
                key={genre}
                type="button"
                className={`genre-chip ${isSelected ? 'is-active' : ''}`}
                onClick={() => onGenreSelect(genre)}
                aria-pressed={isSelected}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter status row */}
      <div className="filter-status-row">
        <span className="results-count">
          Showing <strong>{totalResults}</strong> {totalResults === 1 ? 'movie' : 'movies'}
          {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
          {selectedGenre !== 'All' && <span> in <em>{selectedGenre}</em></span>}
        </span>

        {isFiltered && (
          <button
            type="button"
            className="reset-filters-btn"
            onClick={onResetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}
