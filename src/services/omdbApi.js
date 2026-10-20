/**
 * OMDb API Service
 * Handles communication with the Open Movie Database API
 * using native fetch with AbortController support.
 */

const OMDB_BASE_URL = 'https://www.omdbapi.com/'

/**
 * Retrieves the configured OMDb API key from Vite environment variables.
 * @returns {string} The API key or empty string.
 */
export function getApiKey() {
  const key = import.meta.env.VITE_OMDB_API_KEY
  return typeof key === 'string' ? key.trim() : ''
}

/**
 * Checks whether a valid-looking OMDb API key is configured.
 * @returns {boolean}
 */
export function isApiKeyConfigured() {
  const key = getApiKey()
  return Boolean(key && key !== 'your_omdb_api_key_here')
}

/**
 * Normalizes an OMDb search result item into the CineScope movie schema.
 * Note: OMDb search results only contain Title, Year, imdbID, Type, and Poster.
 * Missing fields are filled with graceful defaults.
 *
 * @param {Object} item - Raw OMDb search item
 * @returns {Object} Normalized CineScope movie object
 */
export function normalizeOmdbSearchItem(item) {
  const hasPoster = item.Poster && item.Poster !== 'N/A'
  const parsedYear = parseInt(item.Year, 10)

  return {
    id: item.imdbID,
    imdbID: item.imdbID,
    title: item.Title || 'Untitled Movie',
    year: !Number.isNaN(parsedYear) ? parsedYear : item.Year || 'N/A',
    rating: 0, // OMDb search list does not include ratings
    genres: ['Movie'], // Default placeholder genre for search list
    duration: 'Feature',
    overview: `Released in ${item.Year || 'N/A'}. Select movie for full details and synopsis.`,
    posterUrl: hasPoster ? item.Poster : null,
    backdropUrl: hasPoster ? item.Poster : null,
    isExternal: true,
  }
}

/**
 * Normalizes full OMDb movie details into the CineScope movie schema.
 * Used when fetching complete movie data by IMDb ID.
 *
 * @param {Object} details - Raw OMDb movie details object
 * @returns {Object} Normalized CineScope movie object
 */
export function normalizeOmdbDetails(details) {
  const hasPoster = details.Poster && details.Poster !== 'N/A'
  const parsedRating = parseFloat(details.imdbRating)
  const parsedYear = parseInt(details.Year, 10)

  const genres =
    details.Genre && details.Genre !== 'N/A'
      ? details.Genre.split(',').map((g) => g.trim())
      : ['Movie']

  return {
    id: details.imdbID,
    imdbID: details.imdbID,
    title: details.Title || 'Untitled Movie',
    year: !Number.isNaN(parsedYear) ? parsedYear : details.Year || 'N/A',
    rating: !Number.isNaN(parsedRating) ? parsedRating : 0,
    genres,
    duration: details.Runtime && details.Runtime !== 'N/A' ? details.Runtime : 'N/A',
    overview:
      details.Plot && details.Plot !== 'N/A'
        ? details.Plot
        : 'No plot synopsis available for this title.',
    posterUrl: hasPoster ? details.Poster : null,
    backdropUrl: hasPoster ? details.Poster : null,
    director: details.Director !== 'N/A' ? details.Director : null,
    actors: details.Actors !== 'N/A' ? details.Actors : null,
    rated: details.Rated !== 'N/A' ? details.Rated : null,
    imdbVotes: details.imdbVotes !== 'N/A' ? details.imdbVotes : null,
    boxOffice: details.BoxOffice !== 'N/A' ? details.BoxOffice : null,
    isExternal: true,
  }
}

/**
 * Searches OMDb for movies matching the query.
 *
 * @param {string} query - The search query
 * @param {Object} [options] - Optional parameters
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {AbortSignal} [options.signal] - AbortSignal for request cancellation
 * @returns {Promise<{success: boolean, movies: Array, totalResults: number, error?: string, isNotFound?: boolean}>}
 */
export async function searchMovies(query, { page = 1, signal } = {}) {
  const apiKey = getApiKey()

  if (!apiKey || apiKey === 'your_omdb_api_key_here') {
    return {
      success: false,
      error: 'API_KEY_MISSING',
      message: 'OMDb API key is not configured in VITE_OMDB_API_KEY.',
      movies: [],
      totalResults: 0,
    }
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return {
      success: true,
      movies: [],
      totalResults: 0,
    }
  }

  const url = `${OMDB_BASE_URL}?apikey=${encodeURIComponent(apiKey)}&s=${encodeURIComponent(
    trimmedQuery
  )}&type=movie&page=${page}`

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`OMDb HTTP error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.Response === 'True') {
    const rawMovies = Array.isArray(data.Search) ? data.Search : []
    return {
      success: true,
      movies: rawMovies.map(normalizeOmdbSearchItem),
      totalResults: parseInt(data.totalResults, 10) || rawMovies.length,
    }
  }

  // OMDb returns Response: "False" with Error string
  const errorMessage = data.Error || 'Unknown error from OMDb API'
  const isNotFound = errorMessage.toLowerCase().includes('not found')

  return {
    success: false,
    error: errorMessage,
    isNotFound,
    movies: [],
    totalResults: 0,
  }
}

/**
 * Fetches complete movie details for a single movie by its IMDb ID.
 * To be used on the movie details page / modal.
 *
 * @param {string} imdbID - The IMDb ID (e.g. 'tt1523967')
 * @param {Object} [options] - Optional parameters
 * @param {AbortSignal} [options.signal] - AbortSignal for request cancellation
 * @returns {Promise<{success: boolean, movie?: Object, error?: string}>}
 */
export async function getMovieDetails(imdbID, { signal } = {}) {
  const apiKey = getApiKey()

  if (!apiKey || apiKey === 'your_omdb_api_key_here') {
    return {
      success: false,
      error: 'API_KEY_MISSING',
      message: 'OMDb API key is not configured in VITE_OMDB_API_KEY.',
    }
  }

  const url = `${OMDB_BASE_URL}?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(
    imdbID
  )}&plot=full`

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`OMDb HTTP error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.Response === 'True') {
    return {
      success: true,
      movie: normalizeOmdbDetails(data),
    }
  }

  return {
    success: false,
    error: data.Error || 'Could not retrieve movie details.',
  }
}
