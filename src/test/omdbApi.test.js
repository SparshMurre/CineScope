import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeOmdbSearchItem,
  normalizeOmdbDetails,
  searchMovies,
  isApiKeyConfigured,
} from '../services/omdbApi.js'

describe('OMDb API Service & Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes OMDb search items with valid poster and year', () => {
    const rawItem = {
      imdbID: 'tt1523967',
      Title: 'Dune: Part Two',
      Year: '2024',
      Poster: 'https://m.media-amazon.com/images/M/poster.jpg',
      Type: 'movie',
    }

    const normalized = normalizeOmdbSearchItem(rawItem)
    expect(normalized.id).toBe('tt1523967')
    expect(normalized.imdbID).toBe('tt1523967')
    expect(normalized.title).toBe('Dune: Part Two')
    expect(normalized.year).toBe(2024)
    expect(normalized.posterUrl).toBe('https://m.media-amazon.com/images/M/poster.jpg')
    expect(normalized.backdropUrl).toBe('https://m.media-amazon.com/images/M/poster.jpg')
    expect(normalized.isExternal).toBe(true)
  })

  it('normalizes OMDb search items with missing or N/A poster and non-numeric year', () => {
    const rawItem = {
      imdbID: 'tt9999999',
      Title: '',
      Year: 'Upcoming',
      Poster: 'N/A',
    }

    const normalized = normalizeOmdbSearchItem(rawItem)
    expect(normalized.title).toBe('Untitled Movie')
    expect(normalized.year).toBe('Upcoming')
    expect(normalized.posterUrl).toBeNull()
    expect(normalized.backdropUrl).toBeNull()
    expect(normalized.genres).toEqual(['Movie'])
  })

  it('normalizes full OMDb movie details with comma-separated genres and parsed numbers', () => {
    const rawDetails = {
      imdbID: 'tt0816692',
      Title: 'Interstellar',
      Year: '2014',
      imdbRating: '8.7',
      Genre: 'Adventure, Drama, Sci-Fi',
      Runtime: '169 min',
      Plot: 'A team of explorers travel through a wormhole in space.',
      Poster: 'https://example.com/interstellar.jpg',
      Director: 'Christopher Nolan',
      Actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
      Rated: 'PG-13',
      imdbVotes: '2,000,000',
      BoxOffice: '$188,020,017',
    }

    const details = normalizeOmdbDetails(rawDetails)
    expect(details.title).toBe('Interstellar')
    expect(details.year).toBe(2014)
    expect(details.rating).toBe(8.7)
    expect(details.genres).toEqual(['Adventure', 'Drama', 'Sci-Fi'])
    expect(details.duration).toBe('169 min')
    expect(details.director).toBe('Christopher Nolan')
    expect(details.actors).toBe('Matthew McConaughey, Anne Hathaway, Jessica Chastain')
    expect(details.boxOffice).toBe('$188,020,017')
  })

  it('handles N/A fields gracefully in normalizeOmdbDetails', () => {
    const rawEmpty = {
      imdbID: 'tt0000000',
      Title: 'Unknown Film',
      Year: 'N/A',
      imdbRating: 'N/A',
      Genre: 'N/A',
      Runtime: 'N/A',
      Plot: 'N/A',
      Poster: 'N/A',
      Director: 'N/A',
      Actors: 'N/A',
      Rated: 'N/A',
      imdbVotes: 'N/A',
      BoxOffice: 'N/A',
    }

    const details = normalizeOmdbDetails(rawEmpty)
    expect(details.year).toBe('N/A')
    expect(details.rating).toBe(0)
    expect(details.genres).toEqual(['Movie'])
    expect(details.duration).toBe('N/A')
    expect(details.overview).toBe('No plot synopsis available for this title.')
    expect(details.posterUrl).toBeNull()
    expect(details.director).toBeNull()
    expect(details.actors).toBeNull()
  })

  it('searchMovies returns empty results immediately for blank query', async () => {
    const result = await searchMovies('   ')
    expect(result.success).toBe(true)
    expect(result.movies).toEqual([])
    expect(result.totalResults).toBe(0)
  })

  it('reports API key configured status as boolean', () => {
    const status = isApiKeyConfigured()
    expect(typeof status).toBe('boolean')
  })
})
