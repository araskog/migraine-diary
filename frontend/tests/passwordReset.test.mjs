import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { afterEach, mock, test } from 'node:test'
import {
  readResetLink,
  requestPasswordReset,
  confirmPasswordReset,
} from '../src/passwordReset.ts'

afterEach(() => mock.restoreAll())

test('reset fragment distinguishes absent, malformed and complete links', () => {
  assert.equal(readResetLink(''), undefined)
  assert.equal(readResetLink('#other'), undefined)
  for (const hash of [
    '#reset-password',
    '#reset-password/uid/',
    '#reset-password/u/t/extra',
    '#reset-password/%ff/token',
  ])
    assert.equal(readResetLink(hash), null)
  assert.deepEqual(
    readResetLink('#reset-password/synthetic-uid/synthetic-token'),
    { uid: 'synthetic-uid', token: 'synthetic-token' },
  )
})

test('request sends an email and CSRF token without putting them in a URL', async () => {
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/password-reset/')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), { email: 'jane@example.test' })
    return Response.json({
      detail: 'If an account exists, we will send a link.',
    })
  })
  await requestPasswordReset('jane@example.test', 'synthetic-csrf')
})

test('confirmation sends reset credentials and matching password fields in the body', async () => {
  const password = `Aa9!${randomBytes(24).toString('base64url')}`
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/password-reset/confirm/')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), {
      uid: 'uid',
      token: 'token',
      new_password1: password,
      new_password2: password,
    })
    return Response.json({ detail: 'Password updated.' })
  })
  await confirmPasswordReset(
    { uid: 'uid', token: 'token' },
    password,
    password,
    'synthetic-csrf',
  )
})

test('invalid-link and password validation errors remain visible', async () => {
  for (const body of [
    { detail: 'This reset link is invalid or expired.' },
    {
      new_password2: [
        {
          message: 'This password is too common.',
          code: 'password_too_common',
        },
      ],
    },
  ]) {
    mock.method(globalThis, 'fetch', async () =>
      Response.json(body, { status: 400 }),
    )
    await assert.rejects(
      confirmPasswordReset(
        { uid: 'uid', token: 'token' },
        'invalid-test-input',
        'invalid-test-input',
        'csrf',
      ),
      /invalid or expired|too common/,
    )
    mock.restoreAll()
  }
})

test('rate limits and connection failures cannot be reported as success', async () => {
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ detail: 'Throttled' }, { status: 429 }),
  )
  await assert.rejects(
    requestPasswordReset('jane@example.test', 'csrf'),
    /Too many requests/,
  )
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('network')
  })
  await assert.rejects(
    requestPasswordReset('jane@example.test', 'csrf'),
    /Unable to connect/,
  )
})

test('malformed success responses cannot imply an email or password was saved', async () => {
  for (const response of [
    Response.json({}),
    new Response('<html>error</html>'),
  ]) {
    mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(
      requestPasswordReset('jane@example.test', 'csrf'),
      /Unable to confirm/,
    )
    mock.restoreAll()
  }
})
