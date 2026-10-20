import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const PRESET_PROMPTS = [
  'Mind-bending space exploration with high stakes and deep emotion',
  'Dark, atmospheric crime thriller with complex characters in Gotham',
  'Visually dazzling adventure exploring multiverses and identity',
  'Intense psychological drama about relentless artistic ambition',
  'Thought-provoking sci-fi about dreams, corporate secrets, and heists',
]

export default function AiRecommender({ favoriteIds = [], onToggleFavorite }) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [imgErrors, setImgErrors] = useState({})

  // AbortController ref to safely manage in-flight requests
  const abortControllerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handlePresetClick = (preset) => {
    setPrompt(preset)
    handleRecommend(preset)
  }

  const handleRecommend = async (customPrompt) => {
    const query = (customPrompt || prompt).trim()
    if (!query) return

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Server responded with status ${response.status}`
        )
      }

      const data = await response.json()
      if (data && data.success && Array.isArray(data.recommendations)) {
        setResult(data)
        setImgErrors({})
      } else {
        throw new Error(
          (data && data.error) || 'Invalid recommendation payload received.'
        )
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(
        err.message ||
          'Failed to connect to recommendation service. Please verify your connection and try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setPrompt('')
    setResult(null)
    setError(null)
    setImgErrors({})
  }

  const handleCardClick = (movie) => {
    const id = movie.imdbID || movie.id
    if (id) {
      navigate(`/movie/${id}`)
    }
  }

  const handleImageError = (movieId) => {
    setImgErrors((prev) => ({ ...prev, [movieId]: true }))
  }

  return (
    <section className="ai-recommender-section" aria-label="AI Movie Recommendations">
      {/* Header Banner */}
      <div className="ai-recommender-header">
        <div className="ai-badge">
          <svg
            className="ai-badge-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2Z" />
          </svg>
          AI-Powered Discovery
        </div>
        <h1 className="ai-header-title">Describe Your Movie Mood</h1>
        <p className="ai-header-desc" id="ai-prompt-hint">
          Tell CineScope what you want to experience in natural language — a vibe,
          themes, pacing, or feelings. Our AI matches your preference with grounded titles
          from our collection.
        </p>
      </div>

      {/* Input Box */}
      <div className="ai-input-card">
        <form
          className="ai-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleRecommend()
          }}
        >
          <div className="ai-textarea-wrapper">
            <label htmlFor="ai-prompt-input" className="sr-only">
              Describe your movie preference or mood
            </label>
            <textarea
              id="ai-prompt-input"
              className="ai-textarea"
              rows={3}
              value={prompt}
              maxLength={1000}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I want an intense psychological movie about ambition and obsession with incredible music and drumming..."
              aria-describedby="ai-prompt-hint"
              disabled={isLoading}
            />
            {prompt && (
              <button
                type="button"
                className="ai-clear-btn"
                onClick={() => setPrompt('')}
                aria-label="Clear input text"
                title="Clear input text"
                disabled={isLoading}
              >
                ✕
              </button>
            )}
          </div>

          <div className="ai-form-actions">
            <div className="ai-preset-chips" aria-label="Example prompts">
              <span className="preset-label">Try asking:</span>
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isLoading}
                >
                  {preset.length > 38 ? `${preset.slice(0, 38)}…` : preset}
                </button>
              ))}
            </div>

            <div className="ai-submit-row">
              {result && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Clear Results
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary ai-submit-btn"
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner-sm" aria-hidden="true" />
                    Finding Matches&hellip;
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className="btn-icon"
                    >
                      <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2Z" />
                    </svg>
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="ai-state-box loading-state-box" aria-busy="true">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="loading-text">
            Consulting AI &amp; grounding against CineScope catalogue&hellip;
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
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
          <h2 className="empty-state-title">Recommendation Error</h2>
          <p className="empty-state-desc">{error}</p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleRecommend()}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Grounded Fallback Notice Banner */}
      {result?.isFallback && !isLoading && (
        <aside className="ai-fallback-banner" role="status">
          <div className="fallback-badge-pill">Local Grounded Mode</div>
          <p className="fallback-banner-text">{result.notice}</p>
        </aside>
      )}

      {/* Initial Empty State (before first recommendation request) */}
      {!result && !isLoading && !error && (
        <div className="ai-empty-guide" role="status">
          <div className="guide-icon-wrapper">
            <svg
              className="guide-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h2 className="guide-title">How to Use CineScope AI Recommendations</h2>
          <div className="guide-tips-grid">
            <div className="guide-tip-card">
              <span className="tip-num">1</span>
              <h3>Describe a Vibe or Mood</h3>
              <p>Type how you want the movie to feel: nostalgic, tense, mind-bending, or heartwarming.</p>
            </div>
            <div className="guide-tip-card">
              <span className="tip-num">2</span>
              <h3>Combine Topics or Settings</h3>
              <p>Ask for combinations like &ldquo;space exploration and family sacrifice&rdquo; or &ldquo;gritty city crime&rdquo;.</p>
            </div>
            <div className="guide-tip-card">
              <span className="tip-num">3</span>
              <h3>Instant Grounded Results</h3>
              <p>Receive tailored matches grounded strictly in our curated cinema library with match reasons.</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Results View */}
      {result && !isLoading && (
        <div className="ai-results-container">
          <div className="ai-summary-card">
            <div className="ai-summary-header">
              <svg
                className="ai-summary-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2Z" />
              </svg>
              <span className="ai-summary-label">
                {result.isAiPowered ? 'AI Recommendation Synthesis' : 'Curated Match Analysis'}
              </span>
            </div>
            <p className="ai-summary-text">{result.summary}</p>
          </div>

          <div className="ai-recs-grid">
            {result.recommendations.map((movie) => {
              const isFav = favoriteIds.includes(movie.id)
              const hasImgError = imgErrors[movie.id]
              const title = movie.title || 'Untitled Movie'
              const year = movie.year || 'N/A'
              const duration = movie.duration || 'N/A'
              const ratingDisplay = movie.rating && movie.rating > 0 ? movie.rating.toFixed(1) : 'NR'
              const relevanceScore = movie.relevanceScore || 90
              const matchReason = movie.matchReason || 'Matches your requested mood and themes.'
              const genres = Array.isArray(movie.genres) ? movie.genres : []

              return (
                <article
                  key={movie.id}
                  className="movie-card ai-rec-card"
                  onClick={() => handleCardClick(movie)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCardClick(movie)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${title} - ${relevanceScore}% match`}
                >
                  <div className="movie-poster-wrapper">
                    {!hasImgError && movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={`${title} poster`}
                        className="movie-poster-img"
                        loading="lazy"
                        onError={() => handleImageError(movie.id)}
                      />
                    ) : (
                      <div className="movie-poster-fallback">
                        <span className="fallback-text">{title}</span>
                      </div>
                    )}

                    {/* Badges: Relevance Score & Favorite Button */}
                    <div className="card-top-badges">
                      <span className="ai-match-badge" title="AI Match Score">
                        ★ {relevanceScore}% Match
                      </span>

                      <button
                        type="button"
                        className={`favorite-card-btn ${isFav ? 'is-favorited' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(movie.id, movie)
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label={
                          isFav
                            ? `Remove ${title} from favorites`
                            : `Add ${title} to favorites`
                        }
                      >
                        <svg
                          className="heart-icon"
                          viewBox="0 0 24 24"
                          fill={isFav ? 'currentColor' : 'none'}
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
                  </div>

                  <div className="movie-card-info">
                    <div className="card-meta-line">
                      <span className="card-year">{year}</span>
                      <span className="card-bullet">•</span>
                      <span className="card-duration">{duration}</span>
                      <span className="card-bullet">•</span>
                      <span className="card-rating">★ {ratingDisplay}</span>
                    </div>

                    <h2 className="movie-card-title" title={title}>{title}</h2>

                    {/* AI Grounded Reason */}
                    <div className="ai-reason-box">
                      <span className="ai-reason-label">Why it matches:</span>
                      <p className="ai-reason-text">{matchReason}</p>
                    </div>

                    {genres.length > 0 && (
                      <div className="card-genre-tags">
                        {genres.map((g) => (
                          <span key={g} className="genre-pill">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
