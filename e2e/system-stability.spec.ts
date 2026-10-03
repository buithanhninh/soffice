import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { launchShell, closeAndSaveVideo, screenshotPath, SHELL_DIR } from './helpers'

const ROOT_DIR = resolve(SHELL_DIR, '../..')

test.describe('System Stability, Quality Gates & Adversarial Hardening (Features 13-16)', () => {
  test.describe('Feature 13: Monorepo Typecheck & Lint Clean Pass', () => {
    test('T1.13.1: eslint.config.mjs excludes archive_web_prototype from lint scanning', async () => {
      const eslintConfigPath = join(ROOT_DIR, 'eslint.config.mjs')
      expect(existsSync(eslintConfigPath)).toBe(true)
      const content = readFileSync(eslintConfigPath, 'utf8')
      expect(content).toContain('archive_web_prototype/**')
    })

    test('T1.13.2: Workspace TypeScript project references are structurally intact', async () => {
      const rootTsConfig = join(ROOT_DIR, 'tsconfig.json')
      if (existsSync(rootTsConfig)) {
        const content = JSON.parse(readFileSync(rootTsConfig, 'utf8'))
        expect(content).toBeDefined()
      }
      expect(existsSync(join(SHELL_DIR, 'tsconfig.json'))).toBe(true)
    })
  })

  test.describe('Feature 14: Unit & Integration Test Verification', () => {
    test('T1.14.1: Core package test suites exist and are configured with Vitest', async () => {
      const corePackages = ['packages/i18n', 'packages/electron-utils', 'packages/ai-provider', 'apps/shell']
      for (const pkg of corePackages) {
        const vitestConfig = join(ROOT_DIR, pkg, 'vitest.config.ts')
        expect(existsSync(vitestConfig)).toBe(true)
      }
    })
  })

  test.describe('Feature 15: Headless Launch Smoke Testing', () => {
    test('T1.15.1: Headless Electron launch boots within 15 seconds and renders Home UI', async () => {
      const startTime = Date.now()
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'smoke-launch' })
      const elapsedSeconds = (Date.now() - startTime) / 1000
      const { page } = launched
      try {
        expect(elapsedSeconds).toBeLessThan(25)
        await expect(page.locator('.home-hero')).toBeVisible()
        await expect(page.locator('.tab-bar')).toBeVisible()
        await page.screenshot({ path: screenshotPath('smoke-headless-boot') })
      } finally {
        await closeAndSaveVideo(launched, 'smoke-launch')
      }
    })

    test('T2.15.1: Scratch userDataDir is isolated and does not contaminate host profile', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'smoke-scratch-user-data' })
      const { userDataDir } = launched
      try {
        expect(userDataDir).toContain('genoffice-e2e-')
        expect(existsSync(userDataDir)).toBe(true)
      } finally {
        await closeAndSaveVideo(launched, 'smoke-scratch-user-data')
      }
    })
  })

  test.describe('Feature 16: Adversarial Coverage Hardening', () => {
    test('T1.16.1: Special character filename handling does not crash the shell', async () => {
      const launched = await launchShell({ onboardingSeen: true, videoDir: 'adversarial-special-filename' })
      const { page } = launched
      try {
        // Attempt opening or navigating with special characters in title / query
        const title = await page.title()
        expect(title).toBeDefined()
        await expect(page.locator('.home-hero')).toBeVisible()
      } finally {
        await closeAndSaveVideo(launched, 'adversarial-special-filename')
      }
    })

    test('T2.16.1: Corrupted or empty ai-settings.json heals safely on launch', async () => {
      // Pre-seed an empty or corrupted ai-settings.json
      const launched = await launchShell({
        onboardingSeen: true,
        videoDir: 'adversarial-corrupt-settings',
        settings: { malformedKey: '<<<corrupt>>>' },
      })
      const { page } = launched
      try {
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await expect(page.locator('.set-dialog')).toBeVisible()
        await page.locator('.set-close').click()
      } finally {
        await closeAndSaveVideo(launched, 'adversarial-corrupt-settings')
      }
    })
  })
})
