import process from 'node:process'
import { MOCK_MOVIES } from '../src/data/mockMovies.js'

/**
 * CineScope Catalog Summary used to ground the AI model
 */
const CATALOG_GROUNDING = MOCK_MOVIES.map((m) => ({
  id: m.id,
  title: m.title,
  year: m.year,
  rating: m.rating,
  duration: m.duration,
  genres: m.genres,
  overview: m.overview,
}))

const MAX_PAYLOAD_BYTES = 50 * 1024 // 50 KB limit
const MAX_PROMPT_LENGTH = 1000

/**
 * Safely reads JSON body with size-limiting to prevent resource exhaustion
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body)
    }

    let raw = ''
    let totalBytes = 0

    req.on('data', (chunk) => {
      totalBytes += chunk.length
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        req.destroy()
        return reject(new Error('Payload Too Large: request body exceeds 50KB limit.'))
      }
      raw += chunk
    })

    req.on('end', () => {
      if (!raw || !raw.trim()) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(new Error(`Malformed JSON body: ${err.message}`))
      }
    })

    req.on('error', reject)
  })
}

/**
 * Sends a structured JSON response with security headers
 */
function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(JSON.stringify(payload))
}

/**
 * Safely extracts and parses JSON from model output, handling markdown fences or wrapper prose
 */
function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  // 1. Strip common markdown formatting
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // 2. Direct parse attempt
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // Continue to substring scan
  }

  // 3. Fallback: Locate first { and matching last }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonSubstring = cleaned.slice(firstBrace, lastBrace + 1)
      const parsed = JSON.parse(jsonSubstring)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      return null
    }
  }

  return null
}

/**
 * High-precision local fallback matcher grounded in CineScope mock catalog
 */
function getLocalFallbackRecommendations(prompt) {
  const cleanPrompt = prompt.toLowerCase()
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'to', 'for', 'in', 'of', 'on', 'with',
    'about', 'like', 'movie', 'movies', 'film', 'films', 'want', 'good', 'some',
  ])
  const tokens = cleanPrompt
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))

  // Thematic keyword boosters
  const themeBoosters = {
    space: ['Interstellar', 'Dune: Part Two'],
    scifi: ['Interstellar', 'Dune: Part Two', 'Inception', 'Blade Runner 2049'],
    'sci-fi': ['Interstellar', 'Dune: Part Two', 'Inception', 'Blade Runner 2049'],
    'mind-bending': ['Inception', 'Everything Everywhere All at Once', 'Blade Runner 2049', 'Interstellar'],
    dream: ['Inception'],
    batman: ['The Dark Knight'],
    joker: ['The Dark Knight'],
    crime: ['The Dark Knight', 'Parasite'],
    dark: ['The Dark Knight', 'Parasite', 'Whiplash', 'Blade Runner 2049'],
    superhero: ['Spider-Man: Across the Spider-Verse', 'The Dark Knight'],
    multiverse: ['Spider-Man: Across the Spider-Verse', 'Everything Everywhere All at Once'],
    animation: ['Spider-Man: Across the Spider-Verse', 'Spirited Away'],
    anime: ['Spirited Away'],
    spirit: ['Spirited Away'],
    music: ['Whiplash'],
    drum: ['Whiplash'],
    drums: ['Whiplash'],
    obsessive: ['Whiplash', 'Inception'],
    intense: ['Whiplash', 'Oppenheimer', 'The Dark Knight'],
    atomic: ['Oppenheimer'],
    bomb: ['Oppenheimer'],
    history: ['Oppenheimer', 'Gladiator II'],
    historical: ['Oppenheimer', 'Gladiator II'],
    roman: ['Gladiator II'],
    gladiator: ['Gladiator II'],
    class: ['Parasite'],
    thriller: ['Parasite', 'Inception', 'The Dark Knight'],
    funny: ['Everything Everywhere All at Once', 'Parasite'],
    comedy: ['Everything Everywhere All at Once', 'Parasite'],
  }

  const scoredMovies = MOCK_MOVIES.map((movie) => {
    let score = 0
    const matchedReasons = []

    const movieTitleLower = movie.title.toLowerCase()
    const movieOverviewLower = movie.overview.toLowerCase()
    const movieGenresLower = movie.genres.map((g) => g.toLowerCase())

    // Direct token matching
    for (const token of tokens) {
      if (movieTitleLower.includes(token)) {
        score += 35
        matchedReasons.push(`matches title keyword "${token}"`)
      }
      if (movieGenresLower.some((g) => g.includes(token))) {
        score += 25
        matchedReasons.push(`matches genre "${token}"`)
      }
      if (movieOverviewLower.includes(token)) {
        score += 15
        matchedReasons.push(`matches theme "${token}"`)
      }

      // Check thematic boosters
      if (themeBoosters[token]?.includes(movie.title)) {
        score += 30
        matchedReasons.push(`matches core theme "${token}"`)
      }
    }

    // Baseline bonus based on rating
    score += (movie.rating || 7) * 2

    // Craft contextual reason
    const reason =
      matchedReasons.length > 0
        ? `Directly ${[...new Set(matchedReasons)].slice(0, 2).join(' and ')} with a ${movie.rating}/10 critical rating.`
        : `Highly acclaimed ${movie.genres.join('/')} title from the CineScope catalog.`

    return {
      movie,
      score,
      reason,
    }
  })

  // Sort descending by score
  scoredMovies.sort((a, b) => b.score - a.score)

  // Pick top 1 to 3
  const topMatches = scoredMovies.slice(0, 3)

  const recommendations = topMatches.map((item, idx) => {
    const relevanceScore = Math.max(78, Math.min(98, Math.round(98 - idx * 6)))

    return {
      id: item.movie.id,
      imdbID: item.movie.imdbID || String(item.movie.id),
      title: item.movie.title,
      year: item.movie.year,
      rating: item.movie.rating,
      genres: item.movie.genres,
      duration: item.movie.duration,
      overview: item.movie.overview,
      posterUrl: item.movie.posterUrl,
      backdropUrl: item.movie.backdropUrl,
      relevanceScore,
      matchReason: item.reason,
    }
  })

  return {
    success: true,
    isAiPowered: false,
    isFallback: true,
    notice:
      'Running in grounded local matching fallback. To enable live Google Gemini AI, configure GEMINI_API_KEY in your server environment.',
    summary: `Found ${recommendations.length} curated ${
      recommendations.length === 1 ? 'title' : 'titles'
    } matching your request.`,
    recommendations,
  }
}

/**
 * Calls Google Gemini REST API using server-side API key
 */
async function callGeminiApi(apiKey, userPrompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`

  const systemInstruction = `You are CineScope's expert AI movie recommendation engine.
You must recommend between 1 and 3 movies exclusively from CineScope's catalog:
${JSON.stringify(CATALOG_GROUNDING, null, 2)}

Strict rules:
1. ONLY recommend movies that exist in the catalog above. Never invent movies.
2. The user's preference prompt is: "${userPrompt}"
3. You must respond with raw JSON only (do NOT enclose in markdown code fences, do NOT add introductory text).
JSON format:
{
  "summary": "1-2 sentences explaining how these recommendations match the user's request",
  "recommendations": [
    {
      "id": <exact number id from catalog>,
      "relevanceScore": <integer between 75 and 99>,
      "matchReason": "<1 sentence explaining why this specific movie fits the preference>"
    }
  ]
}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: systemInstruction }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!rawText) {
    throw new Error('Empty response received from Gemini API')
  }

  const parsed = extractJsonFromText(rawText)
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    throw new Error('Could not parse valid recommendation JSON from Gemini response')
  }

  // Ground and enrich recommendations against MOCK_MOVIES
  const enriched = []
  for (const item of parsed.recommendations) {
    if (!item) continue

    const matchedMovie = MOCK_MOVIES.find(
      (m) =>
        m.id === Number(item.id) ||
        String(m.id) === String(item.id) ||
        (item.title && m.title.toLowerCase() === String(item.title).toLowerCase())
    )

    if (matchedMovie) {
      // Validate and clamp relevance score
      const rawScore = parseInt(item.relevanceScore, 10)
      const relevanceScore = !Number.isNaN(rawScore)
        ? Math.max(50, Math.min(100, rawScore))
        : 90

      const matchReason =
        typeof item.matchReason === 'string' && item.matchReason.trim()
          ? item.matchReason.trim()
          : `Aligned with your interest in ${userPrompt}.`

      enriched.push({
        id: matchedMovie.id,
        imdbID: matchedMovie.imdbID || String(matchedMovie.id),
        title: matchedMovie.title,
        year: matchedMovie.year,
        rating: matchedMovie.rating,
        genres: matchedMovie.genres,
        duration: matchedMovie.duration,
        overview: matchedMovie.overview,
        posterUrl: matchedMovie.posterUrl,
        backdropUrl: matchedMovie.backdropUrl,
        relevanceScore,
        matchReason,
      })
    }
  }

  if (enriched.length === 0) {
    throw new Error('No catalog movies could be verified from Gemini output')
  }

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Here are the best matching movies from CineScope based on your prompt:'

  return {
    success: true,
    isAiPowered: true,
    isFallback: false,
    summary,
    recommendations: enriched,
  }
}

/**
 * Universal request handler (compatible with both Vite middleware and serverless functions)
 */
export default async function aiRecommendHandler(req, res, env = {}) {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {})
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' })
  }

  try {
    const body = await readJsonBody(req)
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return sendJson(res, 400, {
        error: 'Please provide a movie preference prompt.',
      })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return sendJson(res, 400, {
        error: `Prompt is too long (${prompt.length} characters). Please keep it under ${MAX_PROMPT_LENGTH} characters.`,
      })
    }

    // Access server-side secret (never exposed to client)
    const apiKey =
      env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''

    // If key is configured and valid, call Gemini API
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const aiResult = await callGeminiApi(apiKey, prompt)
        return sendJson(res, 200, aiResult)
      } catch (geminiError) {
        console.warn(
          '[CineScope AI] Gemini API call failed, falling back to local catalog matcher:',
          geminiError.message
        )
        // Fall back gracefully to local catalog matcher
        const fallbackResult = getLocalFallbackRecommendations(prompt)
        fallbackResult.notice = `Live Gemini request error (${geminiError.message}). Seamlessly fell back to CineScope catalog matching.`
        return sendJson(res, 200, fallbackResult)
      }
    }

    // If no GEMINI_API_KEY is configured, return grounded local catalog recommendations
    const localResult = getLocalFallbackRecommendations(prompt)
    return sendJson(res, 200, localResult)
  } catch (err) {
    console.error('[CineScope AI] Request handling error:', err)
    return sendJson(res, 500, {
      error: 'An unexpected server error occurred while processing recommendations.',
      details: err.message,
    })
  }
}
