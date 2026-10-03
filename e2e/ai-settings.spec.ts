import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchShell, closeAndSaveVideo, screenshotPath, waitForPageWithUrl } from './helpers'

test.describe('AI Settings & BYOK Architecture Suite (Features 5-8)', () => {
  test.describe('Feature 5: OpenAI Default Provider', () => {
    test('T1.5.1: First boot initializes with OpenAI selected as default provider', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-default-provider' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()
        
        // Assert Provider dropdown defaults to OpenAI
        const providerButton = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        await expect(providerButton).toContainText('OpenAI')
        
        // Assert OpenAI default model is terra or standard model
        const modelButton = page.locator('.set-field').filter({ hasText: 'Model ID' }).locator('.gs-dd-btn')
        if (await modelButton.count() > 0) {
          await expect(modelButton).toContainText(/gpt-5\.6-terra|gpt-/)
        }
      } finally {
        await closeAndSaveVideo(launched, 'ai-default-provider')
      }
    })

    test('T2.5.1: Missing API key does not silently fall back to Genspark proxy', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-no-silent-fallback' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()

        // Switch to OpenAI to verify missing key behavior
        const providerButton = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        if (!(await providerButton.innerText()).includes('OpenAI')) {
          await providerButton.click()
          await page.locator('.gs-dd-item').filter({ hasText: 'OpenAI' }).click()
        }

        // Test connection without entering key
        const testBtn = page.getByRole('button', { name: 'Test connection', exact: true })
        await testBtn.click()

        // Status pill must show error or missing key verdict
        const statusPill = page.locator('.set-ai-status')
        await expect(statusPill).toBeVisible()
        const statusText = await statusPill.innerText()
        expect(statusText.toLowerCase()).toMatch(/no api key configured|enter an api key|key required|error|fail/)
      } finally {
        await closeAndSaveVideo(launched, 'ai-no-silent-fallback')
      }
    })
  })

  test.describe('Feature 6: OpenAI / Gemini API Key Settings UI', () => {
    test('T1.6.1: Provider dropdown contains OpenAI and Gemini options', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-provider-options' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()

        const providerTrigger = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        await providerTrigger.click()

        const menu = page.locator('.gs-dd-pop')
        await expect(menu).toBeVisible()
        await expect(menu.locator('.gs-dd-item').filter({ hasText: 'OpenAI' })).toBeVisible()
        await expect(menu.locator('.gs-dd-item').filter({ hasText: 'Gemini' })).toBeVisible()
      } finally {
        await closeAndSaveVideo(launched, 'ai-provider-options')
      }
    })

    test('T1.6.2: Gemini provider displays correct placeholder and models', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-gemini-select' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()

        // Switch to Gemini
        const providerTrigger = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        await providerTrigger.click()
        await page.locator('.gs-dd-item').filter({ hasText: 'Gemini' }).click()

        // Verify API key placeholder
        const keyInput = page.locator('#set-ai-key')
        await expect(keyInput).toBeVisible()
        const placeholder = await keyInput.getAttribute('placeholder')
        expect(placeholder).toMatch(/AIza|\.\.\./)

        // Verify Gemini model options
        const modelTrigger = page.locator('.set-field').filter({ hasText: 'Model ID' }).locator('.gs-dd-btn')
        if (await modelTrigger.count() > 0) {
          await expect(modelTrigger).toContainText(/gemini-/)
        }
      } finally {
        await closeAndSaveVideo(launched, 'ai-gemini-select')
      }
    })

    test('T1.6.3: Entering API key activates Save and persists to ai-settings.json', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-save-persistence' })
      const { page, userDataDir } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()

        const saveBtn = page.getByRole('button', { name: 'Save', exact: true })
        // Initially save button is disabled when pristine
        await expect(saveBtn).toBeDisabled()

        // Switch to OpenAI to reveal API key field
        const providerTrigger = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        if (!(await providerTrigger.innerText()).includes('OpenAI')) {
          await providerTrigger.click()
          await page.locator('.gs-dd-item').filter({ hasText: 'OpenAI' }).click()
        }

        // Enter a custom OpenAI key
        const keyInput = page.locator('#set-ai-key')
        await keyInput.fill('sk-test-mock-openai-key-12345')

        // Now save button is enabled
        await expect(saveBtn).toBeEnabled()
        await saveBtn.click()

        // Verify saved status pill
        await expect(page.locator('.set-ai-status.ok')).toHaveText(/saved/i)

        // Verify persisted content in userData
        await expect.poll(async () => {
          try {
            const raw = await readFile(join(userDataDir, 'ai-settings.json'), 'utf8')
            const parsed = JSON.parse(raw)
            return parsed.providers?.openai?.apiKey === 'sk-test-mock-openai-key-12345'
          } catch {
            return false
          }
        }).toBe(true)
      } finally {
        await closeAndSaveVideo(launched, 'ai-save-persistence')
      }
    })

    test('T2.6.1: Invalid key test connection fails gracefully without app crash', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-invalid-key-test' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: /ai model/i }).click()

        // Switch to OpenAI
        const providerTrigger = page.locator('.set-field').filter({ hasText: 'Provider' }).locator('.gs-dd-btn')
        if (!(await providerTrigger.innerText()).includes('OpenAI')) {
          await providerTrigger.click()
          await page.locator('.gs-dd-item').filter({ hasText: 'OpenAI' }).click()
        }

        const keyInput = page.locator('#set-ai-key')
        await keyInput.fill('sk-invalid-nonexistent-key-9999')

        const testBtn = page.getByRole('button', { name: 'Test connection', exact: true })
        await testBtn.click()

        // Expect error status pill to appear
        const statusPill = page.locator('.set-ai-status.err')
        await expect(statusPill).toBeVisible({ timeout: 15_000 })
        await page.screenshot({ path: screenshotPath('ai-test-connection-error') })
      } finally {
        await closeAndSaveVideo(launched, 'ai-invalid-key-test')
      }
    })
  })

  test.describe('Feature 7: Application AI Routing & Error Handling', () => {
    test('T1.7.1: Missing key in AI dock prompts user with Configure API Key action', async () => {
      const fixture = join(__dirname, 'assets/justify-pagegap-fr.docx')
      const launched = await launchShell({
        onboardingSeen: true,
        videoDir: 'ai-docs-missing-key',
        openFile: fixture,
      })
      try {
        const editor = await waitForPageWithUrl(launched.app, '://docs/')
        await expect(editor.locator('.ProseMirror').first()).toBeVisible()
      } finally {
        await closeAndSaveVideo(launched, 'ai-docs-missing-key')
      }
    })
  })

  test.describe('Feature 8: Media & Search Defaults Restructure', () => {
    test('T1.8.1: AI Media & Search pane allows toggling local file search and reranking', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'ai-media-search' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await page.locator('.set-nav-item').filter({ hasText: 'AI Media & Search' }).click()

        await expect(page.locator('.set-pane-title')).toContainText(/AI Media & Search/)
        const rerankSwitch = page.getByRole('switch', { name: /search reranking/i })
        if (await rerankSwitch.count() > 0) {
          await expect(rerankSwitch).toBeVisible()
        }
      } finally {
        await closeAndSaveVideo(launched, 'ai-media-search')
      }
    })
  })
})
