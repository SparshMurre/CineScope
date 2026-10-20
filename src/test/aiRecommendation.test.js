import { describe, it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import aiRecommendHandler from '../../api/ai-recommend.js'

class MockReq extends EventEmitter {
  constructor(method, body) {
    super()
    this.method = method
    this.body = body
  }
}

class MockRes {
  constructor() {
    this.headers = {}
    this.statusCode = 200
    this.body = ''
  }
  setHeader(k, v) {
    this.headers[k] = v
  }
  end(data) {
    this.body = data
  }
}

describe('AI Recommendation API & Fallback Matcher', () => {
  it('rejects empty or whitespace-only prompt with 400 Bad Request', async () => {
    const req = new MockReq('POST', { prompt: '   ' })
    const res = new MockRes()

    await aiRecommendHandler(req, res)

    expect(res.statusCode).toBe(400)
    const payload = JSON.parse(res.body)
    expect(payload.error).toMatch(/provide a movie preference prompt/i)
  })

  it('rejects prompts exceeding maximum length limit with 400', async () => {
    const req = new MockReq('POST', { prompt: 'a'.repeat(1005) })
    const res = new MockRes()

    await aiRecommendHandler(req, res)

    expect(res.statusCode).toBe(400)
    const payload = JSON.parse(res.body)
    expect(payload.error).toMatch(/too long/i)
  })

  it('responds with 204 for OPTIONS preflight CORS requests', async () => {
    const req = new MockReq('OPTIONS', null)
    const res = new MockRes()

    await aiRecommendHandler(req, res)

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('responds with 405 for disallowed HTTP methods', async () => {
    const req = new MockReq('GET', null)
    const res = new MockRes()

    await aiRecommendHandler(req, res)

    expect(res.statusCode).toBe(405)
    const payload = JSON.parse(res.body)
    expect(payload.error).toMatch(/Method Not Allowed/i)
  })

  it('returns structured recommendations grounded in CineScope mock catalog in fallback mode', async () => {
    const req = new MockReq('POST', { prompt: 'mind-bending space exploration with high stakes' })
    const res = new MockRes()

    await aiRecommendHandler(req, res)

    expect(res.statusCode).toBe(200)
    const payload = JSON.parse(res.body)

    expect(payload.success).toBe(true)
    expect(payload.isFallback).toBe(true)
    expect(payload.notice).toBeDefined()
    expect(Array.isArray(payload.recommendations)).toBe(true)
    expect(payload.recommendations.length).toBeGreaterThan(0)

    // Verify grounding and structure
    const titles = payload.recommendations.map((r) => r.title)
    expect(titles.some((t) => t === 'Interstellar' || t === 'Dune: Part Two')).toBe(true)

    for (const rec of payload.recommendations) {
      expect(typeof rec.id).toBe('number')
      expect(rec.title).toBeTruthy()
      expect(typeof rec.relevanceScore).toBe('number')
      expect(rec.relevanceScore).toBeGreaterThanOrEqual(50)
      expect(rec.relevanceScore).toBeLessThanOrEqual(100)
      expect(typeof rec.matchReason).toBe('string')
      expect(rec.matchReason.length).toBeGreaterThan(5)
      expect(Array.isArray(rec.genres)).toBe(true)
    }
  })

  it('correctly maps specific genre and mood queries to relevant catalog films', async () => {
    // 1. Music / obsession query
    const reqMusic = new MockReq('POST', { prompt: 'intense drama about music drumming and teacher ambition' })
    const resMusic = new MockRes()
    await aiRecommendHandler(reqMusic, resMusic)
    const dataMusic = JSON.parse(resMusic.body)
    expect(dataMusic.recommendations.some((r) => r.title === 'Whiplash')).toBe(true)

    // 2. Dark superhero / crime query
    const reqCrime = new MockReq('POST', { prompt: 'dark city crime thriller with batman joker gotham' })
    const resCrime = new MockRes()
    await aiRecommendHandler(reqCrime, resCrime)
    const dataCrime = JSON.parse(resCrime.body)
    expect(dataCrime.recommendations.some((r) => r.title === 'The Dark Knight')).toBe(true)
  })
})
