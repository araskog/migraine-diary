import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import {
  PASSWORD_RECOVERY_CONFIRMATION,
  submitPasswordRecovery,
} from '../src/passwordRecovery.ts'

afterEach(() => mock.restoreAll())

test('submitPasswordRecovery posts email with CSRF and returns confirmation', async () => {
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/password-recovery/')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), { email: 'help@example.test' })
    return Response.json(
      { detail: PASSWORD_RECOVERY_CONFIRMATION },
      { status: 200 },
    )
  })
  const result = await submitPasswordRecovery(
    'help@example.test',
    'synthetic-csrf',
  )
  assert.deepEqual(result, {
    ok: true,
    detail: PASSWORD_RECOVERY_CONFIRMATION,
  })
})

test('submitPasswordRecovery maps validation failures', async () => {
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ email: ['Enter a valid email address.'] }, { status: 400 }),
  )
  const result = await submitPasswordRecovery('bad', 'synthetic-csrf')
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.deepEqual(result.errors, ['Enter a valid email address.'])
  }
})
