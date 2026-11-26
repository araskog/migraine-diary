export const INSIGHTS_NARRATE_PATH = '/api/insights/narrate/'
const MAX_FACTS = 3
const MAX_LINES = 3
const MAX_NARRATE_PER_SESSION_PER_DAY = 30
const NARRATE_MODEL = '@cf/meta/llama-3.1-8b-instruct'

const narrationCounts = new Map()

function isoDay() {
  return new Date().toISOString().slice(0, 10)
}

function sessionKey(request) {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)sessionid=([^;]+)/)
  return match ? match[1] : null
}

function withinNarrateBudget(sessionId) {
  if (!sessionId) return false
  const key = `${sessionId}:${isoDay()}`
  const count = narrationCounts.get(key) ?? 0
  if (count >= MAX_NARRATE_PER_SESSION_PER_DAY) return false
  narrationCounts.set(key, count + 1)
  return true
}

export function isInsightFact(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof value.kind === 'string'
  )
}

export function validateNarrateBody(body) {
  if (typeof body !== 'object' || body === null) return null
  if (typeof body.fingerprint !== 'string' || body.fingerprint.length > 128) {
    return null
  }
  if (!Array.isArray(body.facts) || body.facts.length === 0) return null
  if (body.facts.length > MAX_FACTS) return null
  if (!body.facts.every(isInsightFact)) return null
  return { fingerprint: body.fingerprint, facts: body.facts }
}

export function parseNarrateLines(text) {
  if (typeof text !== 'string' || text.trim() === '') return []
  const byLines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
  const lines =
    byLines.length >= 1
      ? byLines
      : text
          .split(/(?<=[.!?])\s+/)
          .map((line) => line.trim())
          .filter(Boolean)
  return lines.slice(0, MAX_LINES)
}

export async function hasAuthenticatedSession(request, apiOrigin) {
  const sessionUrl = new URL(apiOrigin)
  sessionUrl.pathname = '/api/session/'
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  if (!cookie) return false
  headers.set('cookie', cookie)
  const response = await fetch(sessionUrl, {
    headers,
    redirect: 'manual',
  })
  if (!response.ok) return false
  try {
    const body = await response.json()
    return Boolean(body?.user)
  } catch {
    return false
  }
}

function narratePrompt(facts) {
  return `Rephrase the following migraine diary statistics as ${MAX_LINES} short, friendly sentences.
Use only the facts provided. Do not diagnose, predict, or invent numbers.
When total counts are small, use cautious wording (for example "so far" or "in your logs") without claiming strong trends.
One fact may become one sentence. Facts as JSON:
${JSON.stringify(facts)}`
}

export async function handleInsightsNarrate(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!request.headers.get('x-csrftoken')) {
    return Response.json({ useFallback: true }, { status: 403 })
  }
  let apiOrigin
  try {
    apiOrigin = new URL(env.API_ORIGIN)
    if (
      apiOrigin.protocol !== 'https:' ||
      apiOrigin.pathname !== '/' ||
      apiOrigin.search ||
      apiOrigin.hash
    ) {
      throw new Error('Invalid API origin')
    }
  } catch {
    return Response.json({ useFallback: true }, { status: 503 })
  }

  const authed = await hasAuthenticatedSession(request, apiOrigin.href)
  if (!authed) {
    return Response.json({ useFallback: true }, { status: 401 })
  }

  const sessionId = sessionKey(request)
  if (!withinNarrateBudget(sessionId)) {
    return Response.json({ useFallback: true })
  }

  let body
  try {
    body = validateNarrateBody(await request.json())
  } catch {
    return Response.json({ useFallback: true }, { status: 400 })
  }
  if (!body) {
    return Response.json({ useFallback: true }, { status: 400 })
  }

  if (!env.AI?.run) {
    return Response.json({ useFallback: true })
  }

  try {
    const result = await env.AI.run(NARRATE_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You write brief, neutral observations from supplied statistics. No medical claims.',
        },
        { role: 'user', content: narratePrompt(body.facts) },
      ],
    })
    const text =
      typeof result === 'string'
        ? result
        : (result?.response ?? result?.result?.response ?? '')
    const lines = parseNarrateLines(text)
    if (lines.length === 0) {
      return Response.json({ useFallback: true })
    }
    return Response.json(
      { lines },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json({ useFallback: true }, { status: 502 })
  }
}

export async function handleRequest(request, env) {
  const url = new URL(request.url)
  const { pathname } = url
  if (pathname === INSIGHTS_NARRATE_PATH) {
    return handleInsightsNarrate(request, env)
  }
  const proxied =
    pathname.startsWith('/api/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/static/admin/')
  if (!proxied) {
    return env.ASSETS.fetch(request)
  }
  let upstream
  try {
    upstream = new URL(env.API_ORIGIN)
    if (
      upstream.protocol !== 'https:' ||
      upstream.pathname !== '/' ||
      upstream.search ||
      upstream.hash ||
      upstream.username ||
      upstream.password
    ) {
      throw new Error('Invalid API origin')
    }
  } catch {
    return new Response('API unavailable', { status: 503 })
  }
  upstream.pathname = url.pathname
  upstream.search = url.search
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', 'https')
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    })
    const result = new Response(response.body, response)
    if (!pathname.startsWith('/static/admin/')) {
      result.headers.set('Cache-Control', 'no-store')
    }
    return result
  } catch {
    return new Response('API unavailable', { status: 502 })
  }
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env)
  },
}
