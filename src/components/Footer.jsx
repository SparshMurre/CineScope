export default function Footer({ onNavChange }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <svg
              className="footer-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
              <line x1="7" x2="7" y1="2" y2="22" />
              <line x1="17" x2="17" y1="2" y2="22" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <line x1="2" x2="7" y1="7" y2="7" />
              <line x1="2" x2="7" y1="17" y2="17" />
              <line x1="17" x2="22" y1="7" y2="7" />
              <line x1="17" x2="22" y1="17" y2="17" />
            </svg>
            <span className="footer-title">
              Cine<span className="brand-accent">Scope</span>
            </span>
          </div>
          <p className="footer-desc">
            Your ultimate destination for discovering, exploring, and curating cinema masterpieces.
          </p>
        </div>

        <div className="footer-nav">
          <span className="footer-heading">Navigation</span>
          <button
            type="button"
            className="footer-link"
            onClick={() => onNavChange('discover')}
          >
            Discover Movies
          </button>
          <button
            type="button"
            className="footer-link"
            onClick={() => onNavChange('top-rated')}
          >
            Top Rated
          </button>
          <button
            type="button"
            className="footer-link"
            onClick={() => onNavChange('ai-recs')}
          >
            AI Match
          </button>
          <button
            type="button"
            className="footer-link"
            onClick={() => onNavChange('favorites')}
          >
            Favorites
          </button>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">
            © {currentYear} CineScope. Built with React &amp; Vite. All movie data and images are for demo purposes.
          </p>
        </div>
      </div>
    </footer>
  )
}
