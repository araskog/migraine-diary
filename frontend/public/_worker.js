export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) {
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
    headers.delete('x-forwarded-host')
    headers.set('x-forwarded-proto', 'https')
    try {
      const response = await fetch(upstream, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method)
          ? undefined
          : request.body,
        redirect: 'manual',
      })
      const result = new Response(response.body, response)
      result.headers.set('Cache-Control', 'no-store')
      return result
    } catch {
      return new Response('API unavailable', { status: 502 })
    }
  },
}
