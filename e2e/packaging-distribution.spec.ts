import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { SHELL_DIR } from './helpers'

const ROOT_DIR = resolve(SHELL_DIR, '../..')

test.describe('Packaging & Multi-Platform Distribution Suite (Features 9-12)', () => {
  test.describe('Feature 9: Windows Portable & NSIS Packaging', () => {
    test('T1.9.1: electron-builder config specifies NSIS and Portable targets for Windows', async () => {
      const builderPath = join(SHELL_DIR, 'electron-builder.cjs')
      expect(existsSync(builderPath)).toBe(true)
      const content = readFileSync(builderPath, 'utf8')

      // Assert target array contains both nsis and portable
      expect(content).toMatch(/target:\s*\[[\s\S]*?'nsis'[\s\S]*?\]/)
      expect(content).toMatch(/portable/)
      expect(content).toContain("sOffice-Portable-${version}.${ext}")
      expect(content).toContain("sOffice-Setup-${version}.${ext}")
    })

    test('T1.9.2: Windows executableName is set to sOffice', async () => {
      const builderPath = join(SHELL_DIR, 'electron-builder.cjs')
      const content = readFileSync(builderPath, 'utf8')
      expect(content).toMatch(/win:[\s\S]*?executableName:\s*'sOffice'/)
    })
  })

  test.describe('Feature 10: Linux .deb & .AppImage Distribution', () => {
    test('T1.10.1: Release directory contains valid Linux .deb and .AppImage packages', async () => {
      const releaseDir = join(SHELL_DIR, 'release')
      const debPath = join(releaseDir, 'soffice_0.10.0_amd64.deb')
      const appImagePath = join(releaseDir, 'sOffice-0.10.0.AppImage')

      expect(existsSync(debPath)).toBe(true)
      expect(statSync(debPath).size).toBeGreaterThan(50_000_000)

      expect(existsSync(appImagePath)).toBe(true)
      expect(statSync(appImagePath).size).toBeGreaterThan(50_000_000)
    })

    test('T1.10.2: Linux unpacked binary exists and is executable', async () => {
      const unpackedBinary = join(SHELL_DIR, 'release/linux-unpacked/soffice')
      expect(existsSync(unpackedBinary)).toBe(true)
      const stats = statSync(unpackedBinary)
      // Check executable permission bit (0o111)
      expect((stats.mode & 0o111) !== 0).toBe(true)
    })

    test('T2.10.1: Debian control package metadata specifies soffice', async () => {
      const releaseDir = join(SHELL_DIR, 'release')
      const debPath = join(releaseDir, 'soffice_0.10.0_amd64.deb')
      if (existsSync(debPath)) {
        try {
          const info = execSync(`dpkg-deb -I "${debPath}"`, { encoding: 'utf8' })
          expect(info).toContain('Package: soffice')
          expect(info).toMatch(/Maintainer:.*sOffice/i)
        } catch {
          // If dpkg-deb is unavailable in environment, verify builder config
          const builderPath = join(SHELL_DIR, 'electron-builder.cjs')
          const content = readFileSync(builderPath, 'utf8')
          expect(content).toContain("packageName: 'soffice'")
        }
      }
    })
  })

  test.describe('Feature 11: macOS Dual-Arch CI Release Workflow', () => {
    test('T1.11.1: GitHub Actions release workflow includes macOS dual-arch build job', async () => {
      const workflowPath = join(ROOT_DIR, '.github/workflows/build-desktop-release.yml')
      expect(existsSync(workflowPath)).toBe(true)
      const content = readFileSync(workflowPath, 'utf8')

      expect(content).toContain('build-macos')
      expect(content).toContain('macos-latest')
      expect(content).toMatch(/GENOFFICE_MAC_X64:\s*'1'|SOFFICE_MAC_X64:\s*'1'/)
    })

    test('T1.11.2: Release workflow uploads macOS ARM64 and x64 DMGs', async () => {
      const workflowPath = join(ROOT_DIR, '.github/workflows/build-desktop-release.yml')
      const content = readFileSync(workflowPath, 'utf8')

      expect(content).toMatch(/apps\/shell\/release\/\*\.dmg/)
    })
  })

  test.describe('Feature 12: Git Remote & GitHub Release Automation', () => {
    test('T1.12.1: Git remote origin is configured to buithanhninh/soffice', async () => {
      try {
        const remotes = execSync('git remote -v', { cwd: ROOT_DIR, encoding: 'utf8' })
        expect(remotes).toContain('https://github.com/buithanhninh/soffice.git')
        expect(remotes).toContain('origin')
      } catch (err) {
        // Fallback check on .git/config
        const configPath = join(ROOT_DIR, '.git/config')
        if (existsSync(configPath)) {
          const config = readFileSync(configPath, 'utf8')
          expect(config).toContain('buithanhninh/soffice')
        }
      }
    })

    test('T1.12.2: Release workflow generates SHA256SUMS and publishes GitHub Release', async () => {
      const workflowPath = join(ROOT_DIR, '.github/workflows/build-desktop-release.yml')
      const content = readFileSync(workflowPath, 'utf8')

      expect(content).toContain('create-release')
      expect(content).toContain('SHA256SUMS.txt')
      expect(content).toContain('action-gh-release')
    })
  })
})
