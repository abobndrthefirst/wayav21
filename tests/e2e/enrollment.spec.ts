import { test, expect } from '@playwright/test'
import {
  TEST_PROGRAM_ID,
  TEST_TOKEN,
  mockProgramLookup,
  mockApplePassOK,
  mockGoogleWalletOK,
  mockRateLimited,
  sampleProgram,
} from './helpers'

/**
 * End-to-end coverage for the customer-facing /w/:programId enrollment page.
 *
 * All Supabase REST + edge function calls are intercepted via `page.route()`,
 * so these tests run fully offline and don't touch a real backend.
 */

test.describe('Customer enrollment flow', () => {
  test('QR scan → happy path: fills form, both wallet pills appear', async ({ page }) => {
    await mockProgramLookup(page)
    await mockApplePassOK(page)
    await mockGoogleWalletOK(page)

    // Desktop UA (default) → both Apple + Google paths fire
    await page.goto(`/w/${TEST_PROGRAM_ID}?t=${TEST_TOKEN}`)

    // Program loads and shop name renders
    await expect(page.getByRole('heading', { name: sampleProgram.shop.name })).toBeVisible()
    await expect(page.getByText(sampleProgram.reward_title)).toBeVisible()

    // Fill in the form
    await page.getByLabel(/Your name|الاسم/).fill('Test Customer')
    await page.getByLabel(/Phone|الهاتف/).fill('0500000000')

    // Submit
    await page.getByRole('button', { name: /Get my loyalty card|احصل على البطاقة/ }).click()

    // Success state renders both wallet pills
    await expect(page.getByRole('heading', { name: /Card ready|البطاقة جاهزة/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('link', { name: /Apple Wallet/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Google Wallet/i })).toBeVisible()
  })

  test('Missing enrollment token → shows invalid-link error', async ({ page }) => {
    await mockProgramLookup(page)

    // Intentionally no ?t=... query param
    await page.goto(`/w/${TEST_PROGRAM_ID}`)

    await page.getByLabel(/Your name|الاسم/).fill('Test Customer')
    await page.getByLabel(/Phone|الهاتف/).fill('0500000000')
    await page.getByRole('button', { name: /Get my loyalty card|احصل على البطاقة/ }).click()

    // We expect the inline error — should mention "invalid" or "expired"
    await expect(page.getByText(/invalid|expired|منتهي|صالح/i)).toBeVisible()
    // And we must NOT reach the success state
    await expect(page.getByRole('heading', { name: /Card ready|البطاقة جاهزة/ })).toHaveCount(0)
  })

  test('Rate-limited (429 from both endpoints) → user-visible error, no success', async ({ page }) => {
    await mockProgramLookup(page)
    await mockRateLimited(page)

    await page.goto(`/w/${TEST_PROGRAM_ID}?t=${TEST_TOKEN}`)

    await page.getByLabel(/Your name|الاسم/).fill('Test Customer')
    await page.getByLabel(/Phone|الهاتف/).fill('0500000000')
    await page.getByRole('button', { name: /Get my loyalty card|احصل على البطاقة/ }).click()

    // The submit button re-enables after the failures (not stuck in "creating")
    await expect(
      page.getByRole('button', { name: /Get my loyalty card|احصل على البطاقة|Creating|جارٍ/ })
    ).toBeEnabled({ timeout: 10_000 })

    // Success screen should NOT render
    await expect(page.getByRole('heading', { name: /Card ready|البطاقة جاهزة/ })).toHaveCount(0)
  })

  test('Program not found → shows unavailable message', async ({ page }) => {
    // Override: return empty PostgREST result
    await page.route('**/rest/v1/loyalty_programs**', async (route) => {
      await route.fulfill({
        status: 406,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'PGRST116',
          message: 'The result contains 0 rows',
        }),
      })
    })

    await page.goto(`/w/${TEST_PROGRAM_ID}?t=${TEST_TOKEN}`)

    await expect(page.getByText(/not available|not found|غير متاحة|غير موجودة/i)).toBeVisible()
  })
})
