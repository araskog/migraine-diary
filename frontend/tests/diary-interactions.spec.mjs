import { expect, test } from '@playwright/test'

test('diary popup saves, clears and retries without losing focus or remounting', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('tests/diary-interactions.html')
  await page.getByRole('button', { name: 'Run regression checks' }).click()
  const results = page.locator('#results')
  await expect(results).toContainText(/All checks complete|FAIL/, {
    timeout: 15_000,
  })
  await expect(results).not.toContainText('FAIL')
  await expect(results).toContainText('All checks complete')
  expect(errors).toEqual([])
})
