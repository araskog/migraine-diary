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
