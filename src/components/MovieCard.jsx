import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getResponsivePoster(url) {
  if (!url) return { src: '' }
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0]
    return {
      src: `${baseUrl}?auto=format&fit=crop&w=400&q=75`,
      srcSet: `${baseUrl}?auto=format&fit=crop&w=240&q=75 240w, ${baseUrl}?auto=format&fit=crop&w=400&q=75 400w, ${baseUrl}?auto=format&fit=crop&w=600&q=80 600w`,
      sizes: '(max-width: 600px) 45vw, (max-width: 900px) 220px, 260px',
    }
  }
  return { src: url }
}

export default function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  const [imgError, setImgError] = useState(false)
  const navigate = useNavigate()

  const movieId = movie.imdbID || movie.id

  const handleCardClick = () => {
    navigate(`/movie/${movieId}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onToggleFavorite(movie.id, movie)
  }

  const handleFavoriteKeyDown = (e) => {
    e.stopPropagation()
  }

  return (
    <article
      className="movie-card"
      aria-label={movie.title}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {/* Poster Image & Badges */}
      <div className="movie-poster-wrapper">
        {!imgError && movie.posterUrl ? (
          <img
            src={getResponsivePoster(movie.posterUrl).src}
            srcSet={getResponsivePoster(movie.posterUrl).srcSet}
            sizes={getResponsivePoster(movie.posterUrl).sizes}
            alt={`${movie.title} poster`}
            className="movie-poster-img"
            loading="lazy"
            decoding="async"
            width="300"
            height="450"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="movie-poster-fallback" aria-label="Poster not available">
            <svg
              className="fallback-icon"
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
            <span className="fallback-text">{movie.title}</span>
          </div>
        )}

        {/* Top Badges: Rating & Favorite */}
        <div className="card-top-badges">
          <span
            className="rating-badge"
            aria-label={
              movie.rating && movie.rating > 0
                ? `Rating: ${movie.rating} out of 10`
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
            {movie.rating && movie.rating > 0 ? movie.rating.toFixed(1) : 'NR'}
          </span>

          <button
            type="button"
            className={`favorite-card-btn ${isFavorite ? 'is-favorited' : ''}`}
            onClick={handleFavoriteClick}
            onKeyDown={handleFavoriteKeyDown}
            aria-label={
              isFavorite
                ? `Remove ${movie.title} from favorites`
                : `Add ${movie.title} to favorites`
            }
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="heart-icon"
              viewBox="0 0 24 24"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>

        {/* Quick Info Overlay on hover */}
        <div className="card-hover-overlay">
          <p className="card-overview-text">{movie.overview}</p>
        </div>
      </div>

      {/* Card Metadata */}
      <div className="movie-card-info">
        <div className="card-meta-line">
          <span className="card-year">{movie.year}</span>
          <span className="card-bullet">•</span>
          <span className="card-duration">{movie.duration}</span>
        </div>

        <h2 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h2>

        <div className="card-genre-tags">
          {movie.genres.slice(0, 2).map((genre) => (
            <span key={genre} className="genre-pill">
              {genre}
            </span>
          ))}
          {movie.genres.length > 2 && (
            <span className="genre-pill-more">+{movie.genres.length - 2}</span>
          )}
        </div>
      </div>
    </article>
  )
}
