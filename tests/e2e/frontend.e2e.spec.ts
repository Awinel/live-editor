import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Live editor/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Build a component while it renders in front of you.')
    await expect(page.getByRole('link', { name: 'Start a component' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse the gallery' })).toBeVisible()
  })

  test('gallery is public', async ({ page }) => {
    await page.goto('http://localhost:3000/components')

    await expect(page.locator('h1').first()).toHaveText('Gallery')
  })

  test('studio requires an account', async ({ page }) => {
    await page.goto('http://localhost:3000/studio')

    await expect(page).toHaveURL(/\/login\?next=%2Fstudio|\/login\?next=\/studio/)
  })
})
