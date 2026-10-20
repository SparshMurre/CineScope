# CineScope — Movie Discovery & Watchlist Application

CineScope is a modern, responsive React + Vite web application for exploring cinema releases, searching films via the Open Movie Database (OMDb) API, viewing detailed movie metadata, and curating personal favorites.

Designed with a dark cinematic theme and built with pure React, React Router, and vanilla CSS.

---

## Features

- **Dynamic Movie Catalog:** Curated collection of cinema titles with ratings, release year, runtime, genres, synopsis, and poster artwork.
- **AI-Powered Movie Matcher:** Describe what you want to watch in natural language (moods, vibes, plot concepts) and receive structured recommendations grounded in CineScope's library with tailored match reasons and relevance scores.
- **OMDb API Live Search:** Real-time, debounced search (450ms) querying the OMDb API with `AbortController` cancellation to discard stale requests.
- **Offline / Local Mock Fallback:** When searching without an active OMDb API key, CineScope gracefully falls back to searching its local mock catalog and displays an informative banner.
- **Genre & Sort Filters:** Filter by genre chips (Sci-Fi, Action, Drama, etc.) and sort by Rating (Highest first), Year (Newest/Oldest), or Title (A to Z).
- **Movie Details Page (`/movie/:imdbID`):**
  - High-resolution hero backdrop with cinema vignette overlays.
  - Full metadata: poster, release year, runtime, rating badge, genres, plot overview, director, cast (starring), and box office.
  - Dedicated "← Back to Movies" navigation button.
  - **Numeric Mock ID Protection:** Numeric mock titles (e.g. `/movie/1`) are never sent to OMDb and resolve instantly from local data.
- **Favorites & Watchlist:**
  - Add or remove favorites directly from any movie card or from the movie details view.
  - Independent clickable favorite button that does not trigger card navigation.
  - Dedicated "Favorites" tab in the navbar with dynamic counter badge and empty state.
- **Comprehensive UX States:**
  - Animated spinner and skeleton grid placeholders during loading.
  - Friendly error states with recovery actions ("Reset Filters & Return Home", "Back to Movies").
  - Graceful fallback placeholders when poster or backdrop images fail to load or are missing.
- **Zero Heavy UI Frameworks:** Built entirely with vanilla CSS and custom design tokens (no Tailwind, Bootstrap, or Material UI).

---

## Tech Stack

- **Framework:** React 19 (`react`, `react-dom`)
- **Routing:** React Router v7 (`react-router-dom`)
- **Build Tool:** Vite 8 (ESM, ultra-fast HMR and bundling)
- **Styling:** Vanilla CSS (CSS variables, flexbox, CSS grid, media queries)
- **API:** [Open Movie Database (OMDb) API](https://www.omdbapi.com/) via native `fetch`
- **Linting:** ESLint with React Hooks and React Refresh plugins

---

## Setup & Installation

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd cinescope

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

Open `.env` and add your keys:

```env
# Client-side OMDb key (for movie catalog search)
VITE_OMDB_API_KEY=your_omdb_api_key_here

# Server-side Gemini API key (optional, for live AI movie recommendations)
# Kept server-side only; never bundled into or accessible by client React code
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note on AI Recommendations:** If `GEMINI_API_KEY` is omitted, the recommendation endpoint automatically runs in high-precision local fallback mode, grounding recommendations directly in CineScope's catalog without making external requests.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Verification & Build Commands

```bash
# Run automated test suite (Vitest + React Testing Library)
npm test

# Run tests with V8 code coverage report
npm run test:coverage

# Run ESLint to verify code quality and React hook rules
npm run lint

# Build production bundle in dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Environment Variables & Git Security

- `.env` is explicitly ignored in [.gitignore](file:///.gitignore) and is never tracked by version control.
- Only [.env.example](file:///.env.example) (with dummy placeholder keys) is tracked in the repository.
- Verify Git tracking status anytime:
  ```bash
  git status --ignored
  ```
  Ensure `.env` appears under Ignored files.

---

## Routing Structure

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Spotlight banner, search bar, sort dropdown, genre filter chips, and movie catalog grid |
| `/movie/:imdbID` | `MovieDetails` | Detailed view for individual film (supports both numeric mock IDs and alphanumeric IMDb IDs) |
| `*` | `Navigate` | Fallback redirecting invalid routes back to `/` |

---

## AI-Assisted Development Documentation

### AI Workflow & Prompts
During Week 3 development, an AI assistant was utilized as a pair programmer to audit the project, implement routing, and establish the movie details milestone:

1. **Architecture & Pre-requisite Audit:**
   - *Prompt:* Inspect `package.json`, `App.jsx`, `omdbApi.js`, `MovieCard.jsx`, `MovieGrid.jsx`, and styles to form a minimal implementation plan for React Router and Movie Details without breaking existing features.
   - *Result:* Identified that `react-router-dom` was missing. Guided dependency installation before modifying codebase.
2. **Component & Routing Integration:**
   - *Prompt:* Add `BrowserRouter`, configure routes for `/` and `/movie/:imdbID`, extract `HomePage`, and build `MovieDetails` supporting `useParams`, numeric mock ID guard, loading/error states, and back navigation.
   - *Result:* Created `MovieDetails.jsx`, updated `App.jsx` and `main.jsx`, ensuring `Navbar` and `Footer` remain shared.
3. **Event Propagation & Interaction Polish:**
   - *Prompt:* Make movie cards navigate to details while keeping the favorite button independently clickable without navigating.
   - *Result:* Added `onClick` / `onKeyDown` navigation on `.movie-card` and `e.stopPropagation()` on the favorite button in `MovieCard.jsx`.
4. **React 19 Linting & Performance:**
   - *Prompt:* Fix ESLint `react-hooks/set-state-in-effect` errors in `MovieDetails.jsx`.
   - *Result:* Refactored synchronous mock movie lookup to `useMemo` and derived state during rendering, reserving `useEffect` strictly for async OMDb requests.

### What AI Implemented
- Router configuration (`<BrowserRouter>`, `<Routes>`, `<Route>`).
- Reusable `MovieDetails` component with complete metadata display, image error handlers, and back button.
- Numeric ID guard preventing mock IDs (`1`, `2`, etc.) from being passed to OMDb.
- Decoupled `HomePage` component preserving search, sort, filter chips, and hero spotlight.
- Event bubbling fix (`e.stopPropagation()`) for independent favorite toggles on movie cards.
- Vanilla CSS styling for the Movie Details page and card cursor in `App.css`.

### Verification Performed
- **Automated Linting:** `npm run lint` executed and verified with 0 errors and 0 warnings.
- **Production Build:** `npm run build` executed and verified (`vite build` built in <200ms).
- **Routing & State Verification:** Tested `/` homepage rendering, `/movie/1` mock detail rendering, `/movie/999` not-found handling, `/movie/tt...` API loading state, and favorites synchronization across both views.
- **Git Security Verification:** Confirmed `.env` is excluded by `.gitignore` and untracked.
