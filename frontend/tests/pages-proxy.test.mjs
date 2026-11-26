import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../public/_worker.js'

test('API proxy preserves protected writes, cookies and uncached responses', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, 'https://api.example.test/api/diary/?month=11')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('cookie'), 'sessionid=synthetic')
    assert.equal(options.headers.get('origin'), 'https://diary.example.test')
    assert.equal(options.headers.get('x-csrftoken'), 'synthetic')
    assert.equal(options.redirect, 'manual')
    assert.equal(await new Response(options.body).text(), '{}')
    return new Response('{}', {
      headers: { 'Set-Cookie': 'sessionid=new; Secure; HttpOnly' },
    })
  }
  try {
    const response = await worker.fetch(
      new Request('https://diary.example.test/api/diary/?month=11', {
        method: 'POST',
        body: '{}',
        headers: {
          cookie: 'sessionid=synthetic',
          origin: 'https://diary.example.test',
          'x-csrftoken': 'synthetic',
        },
      }),
      { API_ORIGIN: 'https://api.example.test' },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.match(response.headers.get('set-cookie'), /sessionid=new/)
  } finally {
    globalThis.fetch = original
  }
})

test('admin routes proxy to the API origin', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url.pathname, '/admin/login/')
    assert.equal(url.origin, 'https://api.example.test')
    assert.equal(options.headers.get('x-forwarded-host'), 'diary.example.test')
    return new Response('admin')
  }
  try {
    const response = await worker.fetch(
      new Request('https://diary.example.test/admin/login/'),
      { API_ORIGIN: 'https://api.example.test' },
    )
    assert.equal(response.status, 200)
    assert.equal(await response.text(), 'admin')
  } finally {
    globalThis.fetch = original
  }
})

test('static requests use Pages assets and invalid API configuration fails closed', async () => {
  const response = await worker.fetch(
    new Request('https://diary.example.test/'),
    {
      ASSETS: { fetch: async () => new Response('app') },
    },
  )
  assert.equal(await response.text(), 'app')
  const unavailable = await worker.fetch(
    new Request('https://diary.example.test/api/session/'),
    { API_ORIGIN: 'http://invalid.test' },
  )
  assert.equal(unavailable.status, 503)
})

test('insights narrate requires authentication and AI binding', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (url) => {
    if (url.pathname === '/api/session/') {
      return Response.json({
        user: { email: 'demo@test.example', isDemo: true },
      })
    }
    throw new Error(`Unexpected fetch: ${url.href}`)
  }
  const facts = [
    {
      kind: 'weekday_peak',
      weekday: 'Monday',
      count: 3,
      total: 5,
      share: 0.6,
      score: 1.8,
    },
  ]
  try {
    const withoutAi = await worker.fetch(
      new Request('https://diary.example.test/api/insights/narrate/', {
        method: 'POST',
        headers: {
          cookie: 'sessionid=synthetic',
          'x-csrftoken': 'token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ fingerprint: 'abc', facts }),
      }),
      { API_ORIGIN: 'https://api.example.test' },
    )
    assert.equal(withoutAi.status, 200)
    assert.deepEqual(await withoutAi.json(), { useFallback: true })

    globalThis.fetch = async (url) => {
      if (url.pathname === '/api/session/') {
        return Response.json({
          user: { email: 'demo@test.example', isDemo: true },
        })
      }
      throw new Error(`Unexpected fetch: ${url.href}`)
    }
    const withAi = await worker.fetch(
      new Request('https://diary.example.test/api/insights/narrate/', {
        method: 'POST',
        headers: {
          cookie: 'sessionid=synthetic',
          'x-csrftoken': 'token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ fingerprint: 'abc', facts }),
      }),
      {
        API_ORIGIN: 'https://api.example.test',
        AI: {
          run: async () => ({
            response:
              'Mondays stand out in your migraine days.\nSleep patterns vary across the week.',
          }),
        },
      },
    )
    const body = await withAi.json()
    assert.equal(body.lines.length, 2)
  } finally {
    globalThis.fetch = original
  }
})

test('insights narrate rejects missing csrf', async () => {
  const response = await worker.fetch(
    new Request('https://diary.example.test/api/insights/narrate/', {
      method: 'POST',
      headers: {
        cookie: 'sessionid=synthetic',
        'content-type': 'application/json',
      },
      body: '{}',
    }),
    { API_ORIGIN: 'https://api.example.test' },
  )
  assert.equal(response.status, 403)
})
