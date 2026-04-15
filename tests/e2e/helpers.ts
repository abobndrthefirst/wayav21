import { Page } from '@playwright/test'

export const TEST_PROGRAM_ID = '11111111-1111-1111-1111-111111111111'
export const TEST_SHOP_ID = '22222222-2222-2222-2222-222222222222'
export const TEST_TOKEN = 'testtoken.testbody.testsig'

export const sampleProgram = {
  id: TEST_PROGRAM_ID,
  name: 'Coffee Club',
  is_active: true,
  card_color: '#10B981',
  text_color: '#FFFFFF',
  reward_title: 'Free espresso after 10 stamps',
  terms: 'Valid for 12 months from issue date.',
  logo_url: null,
  background_url: null,
  google_maps_url: null,
  loyalty_type: 'stamps',
  shop: {
    id: TEST_SHOP_ID,
    name: 'Bean & Brew',
  },
}

/**
 * Stub the Supabase REST call that WalletEnrollPage makes to load the program.
 * Must be called BEFORE `page.goto(...)`.
 */
export async function mockProgramLookup(page: Page, program: Record<string, any> = sampleProgram) {
  await page.route('**/rest/v1/loyalty_programs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/1' },
      body: JSON.stringify(program),
    })
  })
}

/**
 * Stub the Apple Wallet edge function — returns a fake .pkpass blob.
 */
export async function mockApplePassOK(page: Page) {
  await page.route('**/functions/v1/apple-wallet-public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.apple.pkpass',
      body: Buffer.from('PK\x03\x04' + 'fake-pkpass-bytes'),
    })
  })
}

/**
 * Stub the Google Wallet edge function — returns a save URL.
 */
export async function mockGoogleWalletOK(page: Page) {
  await page.route('**/functions/v1/google-wallet-public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        saveUrl: 'https://pay.google.com/gp/v/save/fake-token',
      }),
    })
  })
}

/**
 * Stub BOTH wallet endpoints to return 429 with Retry-After.
 */
export async function mockRateLimited(page: Page) {
  const handler = async (route: any) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'retry-after': '60' },
      body: JSON.stringify({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        code: 'RATE_LIMITED',
      }),
    })
  }
  await page.route('**/functions/v1/apple-wallet-public', handler)
  await page.route('**/functions/v1/google-wallet-public', handler)
}
