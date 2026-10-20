import { useState } from 'react'

function getResponsiveBackdrop(url) {
  if (!url) return { src: '' }
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0]
    return {
      src: `${baseUrl}?auto=format&fit=crop&w=1280&q=80`,
      srcSet: `${baseUrl}?auto=format&fit=crop&w=640&q=75 640w, ${baseUrl}?auto=format&fit=crop&w=1024&q=75 1024w, ${baseUrl}?auto=format&fit=crop&w=1600&q=80 1600w`,
      sizes: '100vw',
    }
  }
  return { src: url }
}

export default function HeroBanner({
  movie,
  isFavorite,
  onToggleFavorite,
  onExploreClick,
}) {
  const [backdropError, setBackdropError] = useState(false)
  const [trailerNotice, setTrailerNotice] = useState(false)

  if (!movie) return null

  const handleTrailerClick = () => {
    setTrailerNotice(true)
    setTimeout(() => {
      setTrailerNotice(false)
    }, 3500)
  }

  const backdrop = getResponsiveBackdrop(movie.backdropUrl)

  return (
    <section className="hero-banner" aria-label="Featured Movie Spotlight">
      {/* Background Backdrop Image with Gradient */}
      <div className="hero-backdrop-wrapper">
        {!backdropError ? (
          <img
            src={backdrop.src}
            srcSet={backdrop.srcSet}
            sizes={backdrop.sizes}
            alt=""
            className="hero-backdrop-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="1600"
            height="900"
            onError={() => setBackdropError(true)}
          />
        ) : (
          <div className="hero-backdrop-fallback" aria-hidden="true" />
        )}
        <div className="hero-gradient-overlay" />
      </div>

      {/* Featured Content Container */}
      <div className="hero-content">
        <div className="hero-badge-row">
          <span className="hero-pill">
            <svg
              className="pill-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Featured Spotlight
          </span>
          <span className="hero-rating">
            ★ {movie.rating.toFixed(1)}
          </span>
          <span className="hero-meta">{movie.year}</span>
          <span className="hero-meta">{movie.duration}</span>
        </div>

        <h1 className="hero-title">{movie.title}</h1>

        <div className="hero-genres">
          {movie.genres.map((genre) => (
            <span key={genre} className="hero-genre-tag">
              {genre}
            </span>
          ))}
        </div>

        <p className="hero-overview">{movie.overview}</p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTrailerClick}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="btn-icon"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Trailer
          </button>

          <button
            type="button"
            className={`btn ${isFavorite ? 'btn-favorited' : 'btn-secondary'}`}
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="btn-icon"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onExploreClick}
          >
            Explore Library ↓
          </button>
        </div>

        {trailerNotice && (
          <div className="hero-notice" role="status">
            🎬 Trailer streaming will be available in the upcoming API integration release!
          </div>
        )}
      </div>
    </section>
  )
}
