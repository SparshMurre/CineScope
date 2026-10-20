import { useState } from 'react'

export default function Navbar({
  activeNav,
  onNavChange,
  favoritesCount,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (navKey) => {
    onNavChange(navKey)
    setMobileMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <button
          type="button"
          className="brand-logo"
          onClick={() => handleNavClick('discover')}
          aria-label="CineScope Home"
        >
          <svg
            className="brand-icon"
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
          <span className="brand-name">
            Cine<span className="brand-accent">Scope</span>
          </span>
        </button>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Navigation Links */}
        <nav
          className={`nav-links ${mobileMenuOpen ? 'is-open' : ''}`}
          aria-label="Primary Navigation"
        >
          <button
            type="button"
            className={`nav-item ${activeNav === 'discover' ? 'is-active' : ''}`}
            onClick={() => handleNavClick('discover')}
          >
            Discover
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'top-rated' ? 'is-active' : ''}`}
            onClick={() => handleNavClick('top-rated')}
          >
            Top Rated
          </button>

          <button
            type="button"
            className={`nav-item nav-ai ${activeNav === 'ai-recs' ? 'is-active' : ''}`}
            onClick={() => handleNavClick('ai-recs')}
          >
            <svg
              className="nav-ai-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2Z" />
            </svg>
            <span>AI Match</span>
          </button>

          <button
            type="button"
            className={`nav-item nav-favorites ${activeNav === 'favorites' ? 'is-active' : ''}`}
            onClick={() => handleNavClick('favorites')}
          >
            <span>Favorites</span>
            <span
              className={`favorites-badge ${favoritesCount > 0 ? 'has-items' : ''}`}
              aria-label={`${favoritesCount} favorites`}
            >
              {favoritesCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  )
}
