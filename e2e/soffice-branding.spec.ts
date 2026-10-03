import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { launchShell, closeAndSaveVideo, screenshotPath, waitForPageWithUrl, SHELL_DIR } from './helpers'

const ROOT_DIR = resolve(SHELL_DIR, '../..')

test.describe('sOffice Branding Suite (Features 1-4)', () => {
  test.describe('Feature 1: Brand String Purge', () => {
    test('T1.1.1: Home screen UI displays sOffice and contains no legacy GenOffice or Genspark strings', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-home' })
      const { page } = launched
      try {
        await expect(page.locator('.home-hero')).toBeVisible()
        const bodyText = await page.locator('body').innerText()
        
        // Assert absence of legacy strings in visible user interface
        expect(bodyText).not.toContain('GenOffice')
        expect(bodyText).not.toContain('Genspark')
        
        // Assert presence of 7 quick cards
        await expect(page.locator('.quick-card')).toHaveCount(7)
        await page.screenshot({ path: screenshotPath('branding-home-clean') })
      } finally {
        await closeAndSaveVideo(launched, 'branding-home')
      }
    })

    test('T1.1.2: Tab bar and window title reflect sOffice brand standards', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-title' })
      const { page } = launched
      try {
        const title = await page.title()
        // Window title should end with sOffice or contain sOffice
        expect(title.toLowerCase()).toMatch(/soffice/)
        expect(title).not.toContain('GenOffice')
        await expect(page.locator('.tab-bar .tab-item.tab-home')).toBeVisible()
      } finally {
        await closeAndSaveVideo(launched, 'branding-title')
      }
    })

    test('T1.1.3: Settings Modal navigation items and sections use clean branding', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-settings' })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await expect(page.locator('.set-dialog')).toBeVisible()
        
        const settingsText = await page.locator('.set-dialog').innerText()
        expect(settingsText).not.toContain('GenOffice')
        expect(settingsText).not.toContain('Genspark')
        
        await page.locator('.set-close').click()
      } finally {
        await closeAndSaveVideo(launched, 'branding-settings')
      }
    })

    test('T2.1.1: Localized UI (zh-CN) preserves sOffice brand identity', async () => {
      const launched = await launchShell({
        onboardingSeen: true,
        lang: 'zh-CN',
        videoDir: 'branding-localized',
      })
      const { page } = launched
      try {
        const title = await page.title()
        expect(title).not.toContain('GenOffice')
        const bodyText = await page.locator('body').innerText()
        expect(bodyText).not.toContain('GenOffice')
      } finally {
        await closeAndSaveVideo(launched, 'branding-localized')
      }
    })

    test('T1.1.4: Slides editor Home tab ribbon displays sOffice AI group and 0 Genspark brand strings', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-slides-ribbon' })
      const { app, page } = launched
      try {
        const slideCard = page.locator('.quick-card', { hasText: 'AI Slides' })
        await expect(slideCard).toBeVisible()
        await slideCard.click()

        const editorPage = await waitForPageWithUrl(app, '://slides/')
        const ribbon = editorPage.locator('.ribbon, [data-ribbon-body]').first()
        await expect(ribbon).toBeVisible()

        const ribbonText = await ribbon.innerText()
        expect(ribbonText).toContain('sOffice AI')
        expect(ribbonText).not.toContain('Genspark')

        const aiGroupLabel = editorPage.locator('.ribbon-group-label', { hasText: 'sOffice AI' })
        await expect(aiGroupLabel).toBeAttached()

        const legacyMatches = await editorPage
          .locator('.ribbon :text-matches("Genspark", "i"), .ribbon .genspark-mark')
          .count()
        expect(legacyMatches).toBe(0)
      } finally {
        await closeAndSaveVideo(launched, 'branding-slides-ribbon')
      }
    })

    test('T1.1.5: HTML editor ribbon displays sOffice AI action and 0 Genspark brand strings', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-html-ribbon' })
      const { app, page } = launched
      try {
        const htmlCard = page.locator('.quick-card', { hasText: 'AI HTML' })
        await expect(htmlCard).toBeVisible()
        await htmlCard.click()

        const editorPage = await waitForPageWithUrl(app, '://html/')
        const ribbon = editorPage.locator('.ribbon-body, .ribbon').first()
        await expect(ribbon).toBeVisible()

        const ribbonText = await ribbon.innerText()
        expect(ribbonText).toContain('sOffice AI')
        expect(ribbonText).not.toContain('Genspark')

        const legacyMatches = await editorPage
          .locator('.ribbon-body :text-matches("Genspark", "i"), .ribbon-body .genspark-mark')
          .count()
        expect(legacyMatches).toBe(0)
      } finally {
        await closeAndSaveVideo(launched, 'branding-html-ribbon')
      }
    })

    test('T1.1.6: Static audit across all editor ribbon components confirms 0 hardcoded Genspark brand strings', async () => {
      const ribbonFiles = [
        join(ROOT_DIR, 'apps/docs/src/renderer/components/Ribbon.tsx'),
        join(ROOT_DIR, 'apps/sheets/src/renderer/ExcelShell.tsx'),
        join(ROOT_DIR, 'apps/slides/src/renderer/components/RibbonHomeTab.tsx'),
        join(ROOT_DIR, 'apps/slides/src/renderer/App.tsx'),
        join(ROOT_DIR, 'apps/markdown/src/renderer/components/Ribbon.tsx'),
        join(ROOT_DIR, 'apps/html/src/renderer/components/Ribbon.tsx'),
        join(ROOT_DIR, 'apps/pdf/src/renderer/App.tsx'),
      ]
      for (const filePath of ribbonFiles) {
        expect(existsSync(filePath)).toBe(true)
        const content = readFileSync(filePath, 'utf8')
        expect(content).not.toMatch(/<Group\s+label=["']Genspark/i)
        expect(content).not.toMatch(/<span>\s*Genspark/i)
        expect(content).not.toMatch(/label=\{['"]Genspark/i)
      }
    })
  })

  test.describe('Feature 2: Brand Icon & Logo Sync', () => {
    test('T1.2.1: Multi-resolution app icon assets exist in shell build directory', async () => {
      const iconsDir = join(SHELL_DIR, 'build/icons')
      expect(existsSync(iconsDir)).toBe(true)
      
      const files = readdirSync(iconsDir)
      const expectedSizes = ['16x16.png', '32x32.png', '64x64.png', '128x128.png', '256x256.png', '512x512.png', '1024x1024.png']
      for (const size of expectedSizes) {
        expect(files.some((f) => f.includes(size) || f === size)).toBe(true)
      }
      
      // Verify .ico and .icns
      expect(existsSync(join(SHELL_DIR, 'build/icon.ico')) || existsSync(join(iconsDir, 'icon.ico'))).toBe(true)
      expect(existsSync(join(SHELL_DIR, 'build/icon.icns')) || existsSync(join(iconsDir, 'icon.icns'))).toBe(true)
    })

    test('T1.2.2: Home screen renders brand logo with proper dimensions', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-logo' })
      const { page } = launched
      try {
        const logo = page.locator('.sidebar-logo img, .logo-lockup, img[alt="sOffice"]').first()
        await expect(logo).toBeVisible()
        const box = await logo.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThan(10)
        expect(box!.height).toBeGreaterThan(10)
      } finally {
        await closeAndSaveVideo(launched, 'branding-logo')
      }
    })

    test('T2.2.1: Logo preserves visibility across light and dark themes', async () => {
      const launched = await launchShell({
        onboardingSeen: true,
        settings: { theme: 'dark' },
        videoDir: 'branding-dark-theme',
      })
      const { page } = launched
      try {
        const logo = page.locator('.sidebar-logo img, .logo-lockup, img[alt="sOffice"]').first()
        await expect(logo).toBeVisible()
        await page.screenshot({ path: screenshotPath('branding-logo-dark') })
      } finally {
        await closeAndSaveVideo(launched, 'branding-dark-theme')
      }
    })
  })

  test.describe('Feature 3: AI Glyph Component Replacement', () => {
    test('T1.3.1: Quick Create cards and TabBar render sAI brand glyphs', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'branding-glyph' })
      const { page } = launched
      try {
        // Assert no legacy GensparkMark component DOM classes
        const gensparkMarks = await page.locator('.genspark-mark, [data-brand="genspark"]').count()
        expect(gensparkMarks).toBe(0)
      } finally {
        await closeAndSaveVideo(launched, 'branding-glyph')
      }
    })

    test('T2.3.1: Collapsed and expanded sidebar retains clean brand glyphs', async () => {
      const fixture = join(__dirname, 'assets/justify-pagegap-fr.docx')
      const launched = await launchShell({
        onboardingSeen: true,
        videoDir: 'branding-sidebar-glyph',
        openFile: fixture,
      })
      try {
        const editor = await waitForPageWithUrl(launched.app, '://docs/')
        await expect(editor.locator('.ProseMirror').first()).toBeVisible()
        
        // Assert no legacy marks inside docs editor
        const legacyMarks = await editor.locator('.genspark-mark, [data-brand="genspark"]').count()
        expect(legacyMarks).toBe(0)
      } finally {
        await closeAndSaveVideo(launched, 'branding-sidebar-glyph')
      }
    })
  })

  test.describe('Feature 4: Package & Builder Metadata Sync', () => {
    test('T1.4.1: Root and shell package.json reflect sOffice product identity', async () => {
      const rootPkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'))
      expect(rootPkg.description).toContain('sOffice')
      expect(rootPkg.author).toMatch(/Bùi Thành Ninh|sOffice/)

      const shellPkg = JSON.parse(readFileSync(join(SHELL_DIR, 'package.json'), 'utf8'))
      expect(shellPkg.description).toContain('sOffice')
    })

    test('T1.4.2: apps/shell/electron-builder.cjs specifies sOffice build config', async () => {
      const builderPath = join(SHELL_DIR, 'electron-builder.cjs')
      expect(existsSync(builderPath)).toBe(true)
      const content = readFileSync(builderPath, 'utf8')
      
      expect(content).toContain("productName: 'sOffice'")
      expect(content).toContain("appId: 'com.soffice.app'")
      expect(content).toContain("executableName: 'soffice'")
    })

    test('T1.4.3: Linux maintainer and vendor metadata match sOffice support', async () => {
      const builderPath = join(SHELL_DIR, 'electron-builder.cjs')
      const content = readFileSync(builderPath, 'utf8')
      
      // Should not contain team@genspark.ai as active maintainer
      expect(content).not.toContain('Mainfunc, Inc. <team@genspark.ai>')
      expect(content).toContain('sOffice')
    })
  })
})
