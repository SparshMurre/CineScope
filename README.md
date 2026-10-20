# CineScope — Movie Discovery & AI Recommendation Platform

> **Live Production URL:** [https://cine-scope-phi-five.vercel.app/](https://cine-scope-phi-five.vercel.app/)

CineScope is a responsive React + Vite web application for discovering cinema releases, searching films via the Open Movie Database (OMDb) API, viewing detailed metadata, receiving grounded AI movie recommendations, and curating personal watchlists.

Built with pure React 19, React Router v7, and vanilla CSS design tokens.

---

## Features

- **Curated Cinema Catalog:** Browse titles with ratings, release year, runtime, genre chips, plot synopsis, and responsive artwork.
- **AI-Powered Movie Matcher:** Describe viewing preferences in natural language (moods, vibes, plots) and receive structured recommendations grounded in CineScope's library with tailored match reasons and relevance scores.
- **OMDb API Live Search:** Real-time, debounced search (450ms) querying the OMDb API with `AbortController` cancellation to discard stale requests.
- **Offline / Local Mock Fallback:** When searching without an active OMDb key, CineScope gracefully searches its local catalog and displays an informative banner.
- **Genre & Sort Filters:** Filter by genre chips (Sci-Fi, Action, Drama, etc.) and sort by Rating (Highest first), Year (Newest/Oldest), or Title (A to Z).
- **Movie Details Page (`/movie/:imdbID`):** Hero backdrop, complete metadata (director, cast, box office), and numeric mock ID protection (e.g., `/movie/1` resolves locally without unnecessary external API requests).
- **Favorites & Watchlist:** Add or remove favorites with dedicated navbar badge counter and empty state.
- **Zero Heavy UI Frameworks:** Built entirely with vanilla CSS and custom design tokens (no Tailwind, Bootstrap, or Material UI).

---

## Architecture & AI Integration

### AI Architecture
```
User Prompt (Client)
       │
       ▼
[AiRecommender.jsx]  ── POST /api/ai-recommend ──►  [Vercel Serverless Function]
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                                 GEMINI_API_KEY Present?                     No Key / API Error?
                                         │                                           │
                             Google Gemini 1.5 Flash                     Local Catalog Matching Fallback
                                         │                                           │
                                 Structured JSON                             Grounded Heuristic Match
                                         └─────────────────────┬─────────────────────┘
                                                               │
                                                               ▼
                                                  Enriched Client Response
```

### Server-Side Secret Handling & Grounding
- **Secret Isolation:** `GEMINI_API_KEY` is strictly a server-side environment variable in Node.js (`api/ai-recommend.js`). It is never prefixed with `VITE_`, never bundled into client JavaScript, and never exposed in the browser.
- **Catalog Grounding:** The Gemini prompt receives CineScope's catalog structure and is strictly instructed to recommend only existing movies with structured JSON output (`id`, `relevanceScore`, `matchReason`).
- **Sanitization & Resilience:** Server-side parsing validates JSON structure, strips markdown fences, limits payload size to 50KB, and gracefully falls back to local heuristic matching if the key is missing, invalid, or rate-limited.

---

## Tech Stack

- **Frontend:** React 19, React Router v7, Vite 8
- **Serverless API:** Node.js Vercel Serverless Functions (`/api/ai-recommend`)
- **AI Provider:** Google Gemini API (`gemini-1.5-flash`) with server-side proxy
- **External Data:** Open Movie Database (OMDb) REST API
- **Testing:** Vitest, React Testing Library, `@testing-library/jest-dom`, V8 Coverage
- **Styling:** Modern Vanilla CSS (CSS Grid, Flexbox, custom properties, responsive breakpoints)

---

## Setup & Local Development

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cinescope
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure `.env`:
```env
# Client-side OMDb key (for movie catalog search)
VITE_OMDB_API_KEY=your_omdb_api_key_here

# Server-side Gemini API key (optional; if omitted, falls back to local matching)
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Security Note:** `.env` is explicitly ignored in `.gitignore` and is never tracked by version control. Only `.env.example` is committed.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Verification & Audit Evidence

### Automated Tests & Code Coverage
All tests run via Vitest and React Testing Library:
- **Test Suite Result:** 35 passing tests across 6 test suites (0 failures).
- **Statement Coverage:** 55.33% statement coverage (exceeds the 50% target).
- **Component Coverage:** High coverage across critical paths (`MovieGrid` 100%, `Footer` 100%, `Navbar` 91.66%, `FilterControls` 85.71%, `HeroBanner` 78.94%, `MovieCard` 69.56%, `AiRecommender` 67.9%).

```bash
# Run test suite
npm test

# Run tests with coverage report
npm run test:coverage

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Build production bundle
npm run build
```

### Production Build & Linting
- **Lint:** ESLint passed with 0 errors and 0 warnings.
- **Build:** Vite production bundle compiles cleanly (`dist/` in ~150ms).

### Lighthouse Mobile Audit Results
Audited on production deployment ([https://cine-scope-phi-five.vercel.app/](https://cine-scope-phi-five.vercel.app/)):

| Category | Score | Metric Highlights |
| :--- | :--- | :--- |
| **Performance** | **96** | LCP sub-2.5s (responsive `srcSet`, `fetchPriority="high"`, preconnect), CLS 0, TBT 10ms |
| **Accessibility** | **96** | High-contrast palette, ARIA landmarks, accessible button labels, focus outlines |
| **Best Practices** | **100** | HTTPS, modern image formats, clean console, secure headers |
| **SEO** | **92** | Meta viewport, meta description, semantic document structure |

### Accessibility & WCAG Compliance Status
- Automated audit tools report 96% Accessibility.
- **WCAG 2.1 AA Status: Pending Manual Verification.** While automated checks confirm color contrast, valid ARIA attributes, semantic landmarks, and keyboard focus styling, full WCAG 2.1 AA compliance cannot be claimed from Lighthouse alone without comprehensive manual screen-reader testing (NVDA, JAWS, VoiceOver) and full manual keyboard navigation audits across all dynamic view states.

---

## Deployment Checklist & Rollback Plan

### Vercel Deployment Checklist
1. **Repository Link:** Connect GitHub repository to Vercel.
2. **Framework Preset:** Select Vite (Root directory: `./`).
3. **Build Command:** `npm run build` | **Output Directory:** `dist`.
4. **Environment Variables:**
   - `GEMINI_API_KEY`: Server-side secret for AI endpoint.
   - `VITE_OMDB_API_KEY`: Public client key for live movie search.
5. **SPA Routing & API Configuration (`vercel.json`):**
   - Ensure `/api/(.*)` routes directly to `/api/$1`.
   - Ensure `/(.*)` rewrites to `/index.html` for client-side routing (`/movie/:imdbID`, `/favorites`).
6. **Pre-Flight Verification:** Verify `npm test`, `npm run lint`, and `npm run build` pass before production promotion.

### Rollback Plan
- **Vercel Instant Rollback (Primary):**
  1. Navigate to Vercel Project Dashboard > **Deployments**.
  2. Locate the previous verified stable deployment.
  3. Click `...` > **Instant Rollback** (or **Assign to Production**). Instant traffic re-routing occurs with zero downtime.
- **Git Revert (Secondary):**
  ```bash
  git revert <failing-commit-sha>
  git push origin main
  ```
- **Service Degradation Resilience:** If the Gemini API experiences downtime or quota exhaustion, `api/ai-recommend.js` automatically degrades to local grounded matching without returning a 500 or crashing the user interface.

---

## Limitations & Future Roadmap

### Current Limitations
- **API Quotas:** OMDb free tier is limited to 1,000 requests/day; Gemini free tier has per-minute request constraints.
- **Local Catalog Scope:** Offline mode and AI grounding are restricted to CineScope's curated catalog.
- **Client-Side Persistence:** Favorites are currently stored in component state and do not persist across device sessions.

### Future Roadmap
- **Persistent Watchlists:** Implement cloud-backed user accounts and watchlist syncing (e.g., Supabase / Firebase Auth).
- **Trailers & Media:** Integrate YouTube trailer embeds into `MovieDetails`.
- **Manual Accessibility Audit:** Conduct end-to-end screen reader testing (NVDA / VoiceOver) to complete full WCAG 2.1 AA manual verification.

---

## Week 8 Capstone Reflection

Developing CineScope evolved from building an initial client-side React prototype into architecting a resilient, production-ready web application:

1. **Defensive AI Engineering:** Rather than exposing LLM endpoints directly to the browser or accepting unconstrained output, CineScope proxies requests through a serverless function with strict catalog grounding, schema validation, payload size limits, and heuristic local fallback. The application remains fully functional even when external AI services fail.
2. **Performance Optimization:** Targeted profiling revealed that initial render bottlenecks were driven by unoptimized LCP hero imagery. Applying evidence-based optimizations—responsive `srcSet` generation, early DNS preconnect, `fetchPriority="high"`, and `content-visibility: auto`—boosted mobile Lighthouse performance to 96 while maintaining visual quality.
3. **Sustainable Code Quality:** Establishing a modular architecture with comprehensive Vitest coverage (35 tests, 55.33% statement coverage) and clean lint/build pipelines provides confidence for continuous deployment and safe future iterations.
